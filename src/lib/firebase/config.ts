'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBbTyclav1ASil0BwwPddvYJuDJu7YB3GQ",
  authDomain: "lnfinance.firebaseapp.com",
  projectId: "lnfinance",
  storageBucket: "lnfinance.firebasestorage.app",
  messagingSenderId: "718930418010",
  appId: "1:718930418010:web:b687ce5b74099b14823b63",
  measurementId: "G-CZEWBNFE37"
};


// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);


export { app, db, auth, googleProvider, firebaseConfig };
