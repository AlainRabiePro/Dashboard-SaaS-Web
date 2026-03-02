import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC3bnWt0iM2BtiCLDdU8ee80e9ZkX3t6FE",
  authDomain: "interface-graphique-saas.firebaseapp.com",
  projectId: "interface-graphique-saas",
  storageBucket: "interface-graphique-saas.appspot.com",
  messagingSenderId: "929209208166",
  appId: "1:929209208166:web:4fde650fd1a9a4c0c60ca7"
};

export const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
