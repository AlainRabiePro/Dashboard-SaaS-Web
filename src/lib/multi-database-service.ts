/**
 * Service pour gérer les connexions à plusieurs bases de données Firestore
 */

import { 
  initializeApp, 
  getApps, 
  FirebaseApp,
  getApp as getFirebaseApp
} from "firebase/app";
import { 
  getFirestore, 
  Firestore,
  getDocs,
  collection,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "./firebase";

export interface FirebaseConnection {
  id: string;
  name: string;
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FirebaseDatabase {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  lastUsed?: Date;
}

class MultiDatabaseService {
  private databaseApps: Map<string, FirebaseApp> = new Map();
  private databaseInstances: Map<string, Firestore> = new Map();

  /**
   * Récupère ou initialise une connexion à une base de données Firestore
   */
  async getDatabase(databaseId: string): Promise<Firestore | null> {
    // Vérifier si la base est déjà en cache
    if (this.databaseInstances.has(databaseId)) {
      return this.databaseInstances.get(databaseId) || null;
    }

    try {
      // Récupérer la configuration depuis Firestore principal
      const dbConfig = await this.getDatabaseConfig(databaseId);
      if (!dbConfig) {
        console.error(`Configuration not found for database: ${databaseId}`);
        return null;
      }

      // Initialiser l'app Firebase
      const appName = `firestore-${databaseId}`;
      let app: FirebaseApp;

      // Créer une nouvelle app avec cette configuration
      if (getApps().find(a => a.name === appName)) {
        app = getFirebaseApp(appName);
      } else {
        app = initializeApp(dbConfig.config, appName);
      }

      // Récupérer la Firestore instance
      const firestore = getFirestore(app);
      
      // Mettre en cache
      this.databaseApps.set(databaseId, app);
      this.databaseInstances.set(databaseId, firestore);

      return firestore;
    } catch (error) {
      console.error(`Error initializing database ${databaseId}:`, error);
      return null;
    }
  }

  /**
   * Récupère la configuration d'une base depuis la base principale
   */
  private async getDatabaseConfig(databaseId: string): Promise<FirebaseDatabase | null> {
    try {
      const dbRef = doc(db, "databases", databaseId);
      const dbSnap = await getDoc(dbRef);
      
      if (!dbSnap.exists()) {
        return null;
      }

      return dbSnap.data() as FirebaseDatabase;
    } catch (error) {
      console.error(`Error fetching database config:`, error);
      return null;
    }
  }

  /**
   * Récupère toutes les bases de données d'un utilisateur
   */
  async getUserDatabases(userId: string): Promise<FirebaseDatabase[]> {
    try {
      const q = query(
        collection(db, "databases"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseDatabase[];
    } catch (error) {
      console.error("Error fetching user databases:", error);
      return [];
    }
  }

  /**
   * Récupère la base par défaut d'un utilisateur
   */
  async getDefaultDatabase(userId: string): Promise<FirebaseDatabase | null> {
    try {
      const q = query(
        collection(db, "databases"),
        where("userId", "==", userId),
        where("isDefault", "==", true)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) return null;
      
      const doc = snap.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as FirebaseDatabase;
    } catch (error) {
      console.error("Error fetching default database:", error);
      return null;
    }
  }

  /**
   * Nettoie le cache pour une base de données
   */
  clearCache(databaseId: string): void {
    this.databaseInstances.delete(databaseId);
    this.databaseApps.delete(databaseId);
  }

  /**
   * Nettoie tout le cache
   */
  clearAllCache(): void {
    this.databaseInstances.clear();
    this.databaseApps.clear();
  }
}

export const multiDatabaseService = new MultiDatabaseService();
