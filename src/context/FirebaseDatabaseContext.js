import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  ref, 
  set, 
  get, 
  push, 
  remove, 
  onValue, 
  off,
  query,
  orderByChild,
  equalTo,
  orderByKey,
  limitToLast
} from 'firebase/database';
import { database } from '../config/firebaseConfig';

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(true); // Firebase her zaman hazır

  // Firebase Database işlemleri
  const db = {
    // E-posta adresini Firebase key'e uygun hale getir
    encodeEmail: (email) => {
      return email.replace(/\./g, '_DOT_').replace(/@/g, '_AT_');
    },

    // Firebase key'i e-posta adresine çevir
    decodeEmail: (encodedEmail) => {
      return encodedEmail.replace(/_DOT_/g, '.').replace(/_AT_/g, '@');
    },

    // Veri ekleme
    set: async (path, key, data) => {
      try {
        console.log('Firebase set:', path, key, data);
        const encodedKey = db.encodeEmail(key);
        const dbRef = ref(database, `${path}/${encodedKey}`);
        await set(dbRef, data);
        return { success: true };
      } catch (error) {
        console.error('Firebase set error:', error);
        return { success: false, error };
      }
    },

    // Veri alma
    get: async (path, key) => {
      try {
        console.log('Firebase get:', path, key);
        const encodedKey = db.encodeEmail(key);
        const dbRef = ref(database, `${path}/${encodedKey}`);
        const snapshot = await get(dbRef);
        return snapshot.exists() ? snapshot.val() : null;
      } catch (error) {
        console.error('Firebase get error:', error);
        return null;
      }
    },

    // Yeni veri ekleme (otomatik ID ile)
    push: async (path, data) => {
      try {
        console.log('Firebase push:', path, data);
        const dbRef = ref(database, path);
        const newRef = await push(dbRef, data);
        return { success: true, key: newRef.key };
      } catch (error) {
        console.error('Firebase push error:', error);
        return { success: false, error };
      }
    },

    // Veri silme
    remove: async (path) => {
      try {
        console.log('Firebase remove:', path);
        const dbRef = ref(database, path);
        await remove(dbRef);
        return { success: true };
      } catch (error) {
        console.error('Firebase remove error:', error);
        return { success: false, error };
      }
    },

    // Gerçek zamanlı dinleme
    on: (path, callback) => {
      console.log('Firebase on:', path);
      const dbRef = ref(database, path);
      return onValue(dbRef, callback);
    },

    // Dinlemeyi durdur
    off: (path, callback) => {
      console.log('Firebase off:', path);
      const dbRef = ref(database, path);
      off(dbRef, callback);
    },

    // SQLite benzeri metodlar (Firebase için uyarlanmış)
    getAllAsync: async (path) => {
      try {
        const dbRef = ref(database, path);
        const snapshot = await get(dbRef);
        if (!snapshot.exists()) return [];
        
        // Firebase'den gelen objeyi array'e çevir
        const data = snapshot.val();
        return Object.keys(data).map(key => ({
          id: db.decodeEmail(key), // E-posta adresini decode et
          ...data[key]
        }));
      } catch (error) {
        console.error('Firebase getAllAsync error:', error);
        return [];
      }
    },

    getFirstAsync: async (path) => {
      try {
        const dbRef = ref(database, path);
        const snapshot = await get(dbRef);
        if (!snapshot.exists()) return null;
        
        const data = snapshot.val();
        const keys = Object.keys(data);
        if (keys.length === 0) return null;
        
        return {
          [keys[0]]: data[keys[0]]
        };
      } catch (error) {
        console.error('Firebase getFirstAsync error:', error);
        return null;
      }
    },

    runAsync: async (path, data) => {
      try {
        const dbRef = ref(database, path);
        await set(dbRef, data);
        return { success: true };
      } catch (error) {
        console.error('Firebase runAsync error:', error);
        return { success: false, error };
      }
    },

    execAsync: async (path, data) => {
      try {
        const dbRef = ref(database, path);
        await set(dbRef, data);
        return { success: true };
      } catch (error) {
        console.error('Firebase execAsync error:', error);
        return { success: false, error };
      }
    }
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
