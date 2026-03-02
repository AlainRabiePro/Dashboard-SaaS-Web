
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
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
  plan: string;
  storageLimit: number;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'suspended';
  createdAt: any;
  storageUsed: number;
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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (err) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: userRef.path,
      operation: 'get'
    }));
    return null;
  }
}

export async function getSites(uid: string): Promise<Site[]> {
  const sitesRef = collection(db, "users", uid, "sites");
  const q = query(sitesRef, orderBy("createdAt", "desc"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  } catch (err) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sitesRef.path,
      operation: 'list'
    }));
    return [];
  }
}

export async function getInvoices(uid: string): Promise<Invoice[]> {
  const invoicesRef = collection(db, "users", uid, "invoices");
  const q = query(invoicesRef, orderBy("date", "desc"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
  } catch (err) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: invoicesRef.path,
      operation: 'list'
    }));
    return [];
  }
}

export function addSite(uid: string, name: string, url: string) {
  const sitesRef = collection(db, "users", uid, "sites");
  const data = {
    name,
    url,
    status: 'active' as const,
    createdAt: Timestamp.now(),
    storageUsed: 0.1 // Default initial usage
  };

  addDoc(sitesRef, data).catch(async (err) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: sitesRef.path,
      operation: 'create',
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
    // Already handled in the call or via listener
    return;
  }

  if (!profileSnap.exists()) {
    const profileData = {
      name,
      email,
      plan: 'Professional',
      storageLimit: 15
    };

    setDoc(userRef, profileData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'create',
        requestResourceData: profileData
      }));
    });

    const sitesRef = collection(db, "users", uid, "sites");
    const sites = [
      { name: 'Portfolio Site', url: 'https://myportfolio.saasflow.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-01-10')), storageUsed: 2.1 },
      { name: 'Personal Blog', url: 'https://blog.me.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-02-15')), storageUsed: 1.5 },
      { name: 'Internal Wiki', url: 'https://wiki.internal.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-03-01')), storageUsed: 0.6 }
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
