import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
    // Get user ID from header
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all collections data
    const sitesRef = collection(db, 'users', userId, 'sites');
    const sitesSnap = await getDocs(sitesRef);
    
    const domainsRef = collection(db, 'users', userId, 'domains');
    const domainsSnap = await getDocs(domainsRef);

    const deploymentLogsRef = collection(db, 'users', userId, 'deploymentLogs');
    const deploymentLogsSnap = await getDocs(deploymentLogsRef);

    const sites = sitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const domains = domainsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const deploymentLogs = deploymentLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      collections: {
        sites: { name: 'sites', count: sites.length, data: sites },
        domains: { name: 'domains', count: domains.length, data: domains },
        deploymentLogs: { name: 'deploymentLogs', count: deploymentLogs.length, data: deploymentLogs },
      }
    });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
