
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  collection, 
  query, 
  getDocs,
  orderBy, 
  addDoc, 
  Timestamp,
  Firestore
} from "firebase/firestore";
import { db } from "./firebase";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export interface UserProfile {
  name: string;
  email: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  storageLimit: number;
  language?: string;
  timezone?: string;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'suspended';
  createdAt: any;
  storageUsed: number;
  framework: string;
  region: string;
  repositoryUrl?: string;
  // Support pour multiples bases de données
  databases?: {
    [key: string]: {
      id: string;
      name: string;
      type: 'firestore' | 'supabase' | 'mysql' | 'mariadb' | 'postgresql' | 'mongodb' | 'custom';
      config: any;
      isDefault?: boolean;
    };
  };
}

export interface Log {
  id: string;
  timestamp: any;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

export interface Domain {
  id: string;
  domain: string;
  linkedSite: string;
  expiryDate: any;
  dnsStatus: 'propagated' | 'pending' | 'expired';
}

export interface Invoice {
  id: string;
  date: any;
  amount: number;
  status: 'paid' | 'unpaid' | 'pending';
  pdfUrl: string;
}

export function addSite(uid: string, name: string, url: string, repositoryUrl?: string, domain?: string) {
  const sitesRef = collection(db, "users", uid, "sites");
  const data = {
    name,
    url,
    repositoryUrl: repositoryUrl || '',
    status: 'active' as const,
    createdAt: Timestamp.now(),
    storageUsed: 0.1,
    framework: 'Next.js',
    region: 'us-east-1'
  };

  addDoc(sitesRef, data).then((docRef) => {
    const logsRef = collection(db, "users", uid, "sites", docRef.id, "logs");
    addDoc(logsRef, {
      timestamp: Timestamp.now(),
      level: 'info',
      message: `Project initialized successfully with repo: ${repositoryUrl || 'N/A'}.`,
      source: 'System'
    });

    // Créer automatiquement un domaine pour ce site
    if (domain) {
      addDomain(uid, domain, docRef.id);
    }
  }).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sitesRef.path,
      operation: 'create',
      requestResourceData: data
    }));
  });
}

export function addDomain(uid: string, domainName: string, siteId: string) {
  const domainsRef = collection(db, "users", uid, "domains");
  const data = {
    domain: domainName,
    linkedSite: siteId,
    dnsStatus: 'propagated' as const,
    expiryDate: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 an
    createdAt: Timestamp.now(),
  };

  addDoc(domainsRef, data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: domainsRef.path,
      operation: 'create',
      requestResourceData: data
    }));
  });
}

export function updateSite(uid: string, siteId: string, data: Partial<Site>) {
  const siteRef = doc(db, "users", uid, "sites", siteId);
  updateDoc(siteRef, data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: siteRef.path,
      operation: 'update',
      requestResourceData: data
    }));
  });
}

export function deleteSite(uid: string, siteId: string) {
  const siteRef = doc(db, "users", uid, "sites", siteId);
  deleteDoc(siteRef).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: siteRef.path,
      operation: 'delete'
    }));
  });
}

export function updateUserPlan(uid: string, plan: UserProfile['plan'], storageLimit: number) {
  const userRef = doc(db, "users", uid);
  const data = { plan, storageLimit };

  updateDoc(userRef, data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: data
    }));
  });
}

export function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  
  updateDoc(userRef, data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'update',
      requestResourceData: data
    }));
  });
}

export async function seedMockData(uid: string, email: string, name: string) {
  const userRef = doc(db, "users", uid);
  
  let profileSnap;
  try {
    profileSnap = await getDoc(userRef);
  } catch (e) {
    return;
  }

  if (!profileSnap.exists()) {
    const profileData = {
      name,
      email,
      plan: null,               // ❌ Aucun plan assigné
      storageLimit: 0,          // ❌ 0 = doit choisir un plan (force redirection vers /select-plan)
      subscriptionStatus: null
    };

    await setDoc(userRef, profileData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: profileData
      }));
    });

    // ✅ Profil utilisateur créé vide - pas de données de seed
    // Les sites et domaines seront ajoutés par l'utilisateur via le dashboard
  }
}
