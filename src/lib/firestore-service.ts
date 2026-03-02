
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";

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
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserProfile;
  }
  return null;
}

export async function getSites(uid: string): Promise<Site[]> {
  const q = query(collection(db, "users", uid, "sites"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
}

export async function getDomains(uid: string): Promise<Domain[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "domains"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Domain));
}

export async function getInvoices(uid: string): Promise<Invoice[]> {
  const q = query(collection(db, "users", uid, "invoices"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function addSite(uid: string, name: string, url: string) {
  return await addDoc(collection(db, "users", uid, "sites"), {
    name,
    url,
    status: 'active',
    createdAt: Timestamp.now()
  });
}

export async function seedMockData(uid: string, email: string, name: string) {
  const userRef = doc(db, "users", uid);
  const profileSnap = await getDoc(userRef);

  if (!profileSnap.exists()) {
    // Create Profile
    await setDoc(userRef, {
      name,
      email,
      plan: 'Pro Plan',
      storageLimit: 10
    });

    // Seed Sites
    const sites = [
      { name: 'Portfolio Site', url: 'https://myportfolio.saasflow.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-01-10')) },
      { name: 'Personal Blog', url: 'https://blog.me.com', status: 'active', createdAt: Timestamp.fromDate(new Date('2024-02-15')) }
    ];
    for (const site of sites) {
      await addDoc(collection(db, "users", uid, "sites"), site);
    }

    // Seed Domains
    const domains = [
      { domain: 'saasflow-demo.com', linkedSite: 'Portfolio Site', expiryDate: Timestamp.fromDate(new Date('2025-01-10')), dnsStatus: 'propagated' },
      { domain: 'blog-me.com', linkedSite: 'Personal Blog', expiryDate: Timestamp.fromDate(new Date('2024-12-15')), dnsStatus: 'pending' }
    ];
    for (const domain of domains) {
      await addDoc(collection(db, "users", uid, "domains"), domain);
    }

    // Seed Invoices
    const invoices = [
      { date: Timestamp.fromDate(new Date('2024-03-01')), amount: 29.00, status: 'paid', pdfUrl: '#' },
      { date: Timestamp.fromDate(new Date('2024-02-01')), amount: 29.00, status: 'paid', pdfUrl: '#' }
    ];
    for (const invoice of invoices) {
      await addDoc(collection(db, "users", uid, "invoices"), invoice);
    }
  }
}
