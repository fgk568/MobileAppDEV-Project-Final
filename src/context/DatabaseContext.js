import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

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

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('lawyer_app.db');
        
        // Avukatlar tablosu
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

        // Dava dosyaları tablosu
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
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lawyer_id) REFERENCES lawyers (id),
            FOREIGN KEY (client_id) REFERENCES clients (id)
          );
        `);

        // Takvim etkinlikleri tablosu
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
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lawyer_id) REFERENCES lawyers (id)
          );
        `);

        // Dava aşamaları tablosu
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS case_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            order_index INTEGER DEFAULT 0
          );
        `);

        // Dava süreç takibi tablosu
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS case_process_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_id INTEGER NOT NULL,
            stage_id INTEGER NOT NULL,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES cases (id),
            FOREIGN KEY (stage_id) REFERENCES case_stages (id)
          );
        `);

        // Müvekkil tablosu
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

        // Müvekkil iletişim geçmişi tablosu
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS client_communications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            subject TEXT,
            content TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id)
          );
        `);

        // Finansal yönetim tablosu
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lawyer_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lawyer_id) REFERENCES lawyers (id)
          );
        `);

        // Doküman yönetimi tablosu
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lawyer_id) REFERENCES lawyers (id),
            FOREIGN KEY (case_id) REFERENCES cases (id)
          );
        `);

        // Mevcut cases tablosuna eksik sütunları ekle
        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN total_fee REAL DEFAULT 0;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN paid_fee REAL DEFAULT 0;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN remaining_fee REAL DEFAULT 0;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        // Calendar_events tablosuna eksik sütunları ekle
        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN event_type TEXT DEFAULT 'Genel';
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN location TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN client_name TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN case_number TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN is_reminder INTEGER DEFAULT 0;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN reminder_time TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'Planlandı';
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        // Cases tablosu için yeni alanlar
        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN court_name TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN case_type TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN opposing_party TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN payment_date TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN description TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        // Chat mesajları tablosu
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES lawyers (id),
            FOREIGN KEY (receiver_id) REFERENCES lawyers (id)
          );
        `);

        // Activity logs tablosu
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES lawyers (id)
          );
        `);

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN event_type TEXT DEFAULT 'Genel';
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        try {
          await database.execAsync(`
            ALTER TABLE calendar_events ADD COLUMN location TEXT;
          `);
        } catch (e) {
          // Sütun zaten varsa hata vermez
        }

        // Varsayılan aşamaları ekle
        const defaultStages = [
          ['Açılış', 'Dava dosyası açıldı', 1],
          ['İnceleme', 'Belgeler inceleniyor', 2],
          ['Hazırlık', 'Duruşma hazırlığı', 3],
          ['Duruşma', 'Mahkeme duruşması', 4],
          ['Karar', 'Mahkeme kararı', 5],
          ['Temyiz', 'Temyiz süreci', 6],
          ['Sonuç', 'Dava sonuçlandı', 7],
        ];

        for (const stage of defaultStages) {
          await database.runAsync(`
            INSERT OR IGNORE INTO case_stages (name, description, order_index)
            VALUES (?, ?, ?)
          `, stage);
        }

        // Migration: Add client_id column to cases table if it doesn't exist
        try {
          await database.execAsync(`
            ALTER TABLE cases ADD COLUMN client_id INTEGER;
          `);
        } catch (error) {
          // Column might already exist, ignore error
          console.log('client_id column might already exist');
        }

        // Update existing cases to link with clients based on client_name
        try {
          await database.execAsync(`
            UPDATE cases 
            SET client_id = (
              SELECT id FROM clients 
              WHERE clients.name = cases.client_name 
              LIMIT 1
            )
            WHERE client_id IS NULL;
          `);
        } catch (error) {
          console.log('Error updating client_id:', error);
        }

        setDb(database);
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };

    initDatabase();
  }, []);

  const value = {
    db,
    isReady: !!db
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
