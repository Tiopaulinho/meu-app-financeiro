// This file is intended to be used by Server Actions, which, despite the name,
// can be executed on the client. By separating this from the main `config.ts`,
// we can avoid including the `firebase-admin` package in client-side bundles.
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBbTyclav1ASil0BwwPddvYJuDJu7YB3GQ",
  authDomain: "lnfinance.firebaseapp.com",
  projectId: "lnfinance",
  storageBucket: "lnfinance.firebasestorage.app",
  messagingSenderId: "718930418010",
  appId: "1:718930418010:web:c8bc146a06af43be823b63",
  measurementId: "G-R99HNCN4N9"
};

const app = !getApps().length ? initializeApp(firebaseConfig, "client") : getApp("client");
const db = getFirestore(app);

export { app as clientApp, db };
