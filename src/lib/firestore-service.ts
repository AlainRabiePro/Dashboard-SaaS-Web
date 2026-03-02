
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
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

export function addSite(uid: string, name: string, url: string) {
  const sitesRef = collection(db, "users", uid, "sites");
  const data = {
    name,
    url,
    status: 'active' as const,
    createdAt: Timestamp.now(),
    storageUsed: 0.1,
    framework: 'Next.js',
    region: 'us-east-1'
  };

  addDoc(sitesRef, data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sitesRef.path,
      operation: 'create',
      requestResourceData: data
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
      plan: 'Professional' as const,
      storageLimit: 15
    };

    await setDoc(userRef, profileData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: profileData
      }));
    });

    const sitesRef = collection(db, "users", uid, "sites");
    const sites = [
      { name: 'Portfolio Site', url: 'https://myportfolio.saasflow.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-01-10')), storageUsed: 2.1, framework: 'Next.js', region: 'us-east-1' },
      { name: 'Personal Blog', url: 'https://blog.me.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-02-15')), storageUsed: 1.5, framework: 'React', region: 'eu-west-3' },
      { name: 'Internal Wiki', url: 'https://wiki.internal.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-03-01')), storageUsed: 0.6, framework: 'Vite', region: 'us-west-2' }
    ];
    for (const site of sites) {
      addDoc(sitesRef, site).catch(() => {});
    }

    const domainsRef = collection(db, "users", uid, "domains");
    const domains = [
      { domain: 'saasflow-demo.com', linkedSite: 'Portfolio Site', expiryDate: Timestamp.fromDate(new Date('2025-01-10')), dnsStatus: 'propagated' },
      { domain: 'blog-me.com', linkedSite: 'Personal Blog', expiryDate: Timestamp.fromDate(new Date('2024-12-15')), dnsStatus: 'pending' }
    ];
    for (const domain of domains) {
      addDoc(domainsRef, domain).catch(() => {});
    }

    const invoicesRef = collection(db, "users", uid, "invoices");
    const invoices = [
      { date: Timestamp.fromDate(new Date('2024-03-01')), amount: 9.99, status: 'paid', pdfUrl: '#' },
      { date: Timestamp.fromDate(new Date('2024-02-01')), amount: 9.99, status: 'paid', pdfUrl: '#' }
    ];
    for (const invoice of invoices) {
      addDoc(invoicesRef, invoice).catch(() => {});
    }
  }
}
