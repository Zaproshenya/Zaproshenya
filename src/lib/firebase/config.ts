import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBfhpU5VCYLqs2M_N6ozEh5ZqJL8XlZMM8",
  authDomain: "zaproshenya-82751.firebaseapp.com",
  databaseURL: "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zaproshenya-82751",
  storageBucket: "zaproshenya-82751.firebasestorage.app",
  messagingSenderId: "912178652602",
  appId: "1:912178652602:web:ade20cdf841e2194e02983",
  measurementId: "G-B5VF0PHW3C"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, storage };
