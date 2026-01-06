import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase konfigürasyonu
const firebaseConfig = {
  apiKey: "AIzaSyDvau9lww1JD9XqDg7I47TovWjESXBlApM",
  authDomain: "syhukukmobilapp-7923b.firebaseapp.com",
  databaseURL: "https://syhukukmobilapp-7923b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "syhukukmobilapp-7923b",
  storageBucket: "syhukukmobilapp-7923b.firebasestorage.app",
  messagingSenderId: "104291934775",
  appId: "1:104291934775:web:1f92fdc2d898f470e255b2"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Realtime Database referansını al
export const database = getDatabase(app);

export default app;
