import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { getFirmConfig } from '../config/firms';

const MultiDatabaseContext = createContext();

export const useMultiDatabase = () => {
  const context = useContext(MultiDatabaseContext);
  if (!context) {
    throw new Error('useMultiDatabase must be used within a MultiDatabaseProvider');
  }
  return context;
};

export const MultiDatabaseProvider = ({ children }) => {
  const [currentFirmId, setCurrentFirmId] = useState(null);
  const [databases, setDatabases] = useState({});
  const [isReady, setIsReady] = useState(false);

  // Mevcut büro ID'sini al
  const getCurrentFirmId = async () => {
    try {
      // AsyncStorage'dan kaydedilmiş büro ID'sini al
      const { getItem } = await import('@react-native-async-storage/async-storage');
      const savedFirmId = await getItem('currentFirmId');
      return savedFirmId || 'firm1'; // Varsayılan büro
    } catch (error) {
      console.error('Error getting current firm ID:', error);
      return 'firm1';
    }
  };

  // Büro ID'sini kaydet
  const saveCurrentFirmId = async (firmId) => {
    try {
      const { setItem } = await import('@react-native-async-storage/async-storage');
      await setItem('currentFirmId', firmId);
    } catch (error) {
      console.error('Error saving current firm ID:', error);
    }
  };

  // Veritabanı bağlantısı oluştur
  const createDatabaseConnection = async (firmId) => {
    try {
      const config = getFirmConfig(firmId);
      const dbName = config.database;
      
      // SQLite veritabanı oluştur
      const db = SQLite.openDatabase(dbName);
      
      // Veritabanı şemasını oluştur
      await initializeDatabaseSchema(db);
      
      return db;
    } catch (error) {
      console.error(`Error creating database for firm ${firmId}:`, error);
      throw error;
    }
  };

  // Veritabanı şemasını oluştur
  const initializeDatabaseSchema = async (db) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Lawyers tablosu
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS lawyers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            color TEXT DEFAULT '#4a9eff',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Clients tablosu
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            tc_number TEXT,
            birth_date TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Cases tablosu
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lawyer_id INTEGER NOT NULL,
            client_id INTEGER,
            case_number TEXT NOT NULL,
            title TEXT NOT NULL,
            client_name TEXT NOT NULL,
            court_name TEXT,
            case_type TEXT,
            opposing_party TEXT,
            status TEXT DEFAULT 'Açık',
            total_fee REAL DEFAULT 0,
            paid_fee REAL DEFAULT 0,
            remaining_fee REAL DEFAULT 0,
            payment_date TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lawyer_id) REFERENCES lawyers (id),
            FOREIGN KEY (client_id) REFERENCES clients (id)
          );
        `);

        // Calendar events tablosu
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            time TEXT,
            event_type TEXT DEFAULT 'Duruşma',
            location TEXT,
            lawyer_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lawyer_id) REFERENCES lawyers (id)
          );
        `);

        // Chat messages tablosu
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES lawyers (id),
            FOREIGN KEY (receiver_id) REFERENCES lawyers (id)
          );
        `);

        // Activity logs tablosu
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id INTEGER,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES lawyers (id)
          );
        `);

        // Varsayılan avukat ekle
        tx.executeSql(`
          INSERT OR IGNORE INTO lawyers (id, name, email, color) 
          VALUES (1, 'Ana Avukat', 'admin@firm.com', '#4a9eff');
        `);

      }, (error) => {
        console.error('Error creating database schema:', error);
        reject(error);
      }, () => {
        console.log('Database schema created successfully');
        resolve();
      });
    });
  };

  // Büro değiştir
  const switchFirm = async (firmId) => {
    try {
      console.log(`Switching to firm: ${firmId}`);
      
      // Mevcut büro ID'sini kaydet
      await saveCurrentFirmId(firmId);
      setCurrentFirmId(firmId);
      
      // Yeni büro için veritabanı oluştur
      if (!databases[firmId]) {
        const db = await createDatabaseConnection(firmId);
        setDatabases(prev => ({
          ...prev,
          [firmId]: db
        }));
      }
      
      setIsReady(true);
    } catch (error) {
      console.error('Error switching firm:', error);
      setIsReady(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    const initialize = async () => {
      try {
        const firmId = await getCurrentFirmId();
        await switchFirm(firmId);
      } catch (error) {
        console.error('Error initializing multi-database:', error);
        setIsReady(false);
      }
    };
    
    initialize();
  }, []);

  // Mevcut veritabanını al
  const getCurrentDatabase = () => {
    if (!currentFirmId || !databases[currentFirmId]) {
      return null;
    }
    return databases[currentFirmId];
  };

  // Mevcut büro konfigürasyonunu al
  const getCurrentFirmConfig = () => {
    return getFirmConfig(currentFirmId);
  };

  const value = {
    currentFirmId,
    databases,
    isReady,
    switchFirm,
    getCurrentDatabase,
    getCurrentFirmConfig,
    getCurrentFirmId
  };

  return (
    <MultiDatabaseContext.Provider value={value}>
      {children}
    </MultiDatabaseContext.Provider>
  );
};
