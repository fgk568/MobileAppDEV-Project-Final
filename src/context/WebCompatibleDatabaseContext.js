import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        if (Platform.OS === 'web') {
          // Web için IndexedDB kullan
          const db = await initIndexedDB();
          setDb(db);
        } else {
          // Mobil için SQLite kullan
          const SQLite = require('expo-sqlite');
          const database = await SQLite.openDatabaseAsync('lawyer_app.db');
          await createTables(database);
          setDb(database);
        }
        setIsReady(true);
      } catch (error) {
        console.error('Database initialization error:', error);
        setIsReady(true); // Hata olsa bile uygulama çalışsın
      }
    };

    initDatabase();
  }, []);

  const initIndexedDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lawyer_app_db', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Tabloları oluştur
        if (!db.objectStoreNames.contains('lawyers')) {
          db.createObjectStore('lawyers', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('calendar_events')) {
          db.createObjectStore('calendar_events', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('expenses')) {
          db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('chat_messages')) {
          db.createObjectStore('chat_messages', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('activity_logs')) {
          db.createObjectStore('activity_logs', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const createTables = async (database) => {
    // SQLite tablolarını oluştur
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
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

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT,
        event_type TEXT DEFAULT 'Genel',
        location TEXT,
        client_name TEXT,
        case_number TEXT,
        is_reminder INTEGER DEFAULT 0,
        reminder_time TEXT,
        status TEXT DEFAULT 'Planlandı',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_id INTEGER NOT NULL,
        case_id INTEGER,
        title TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        category TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        target_type TEXT,
        target_id INTEGER,
        target_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  };

  const value = {
    db,
    isReady
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
