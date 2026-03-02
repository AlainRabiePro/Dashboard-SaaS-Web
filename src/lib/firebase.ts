
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC3bnWt0iM2BtiCLDdU8ee80e9ZkX3t6FE",
  authDomain: "interface-graphique-saas.firebaseapp.com",
  projectId: "interface-graphique-saas",
  storageBucket: "interface-graphique-saas.firebasestorage.app",
  messagingSenderId: "929209208166",
  appId: "1:929209208166:web:4fde650fd1a9a4c0c60ca7"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
