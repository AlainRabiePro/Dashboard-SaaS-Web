import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

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

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { siteId } = await request.json();

    if (!userId || !siteId) {
      return NextResponse.json({ error: 'Missing userId or siteId' }, { status: 400 });
    }

    // Initialiser les données de monitoring pour ce site
    const siteRef = doc(db, 'users', userId, 'sites', siteId);
    
    // Générer des données réalistes de monitoring
    const monitoringData = {
      uptime: 99.8 + Math.random() * 0.2, // 99.8-100%
      latency: Math.floor(45 + Math.random() * 55), // 45-100ms
      errorRate: Math.random() * 0.5, // 0-0.5%
      status: 'healthy',
      domain: `site-${siteId.substring(0, 8)}.example.com`,
      lastUpdated: new Date().toISOString(),
    };

    await setDoc(siteRef, monitoringData, { merge: true });

    return NextResponse.json({ 
      success: true,
      message: 'Monitoring data initialized',
      data: monitoringData 
    });
  } catch (error: any) {
    console.error('Error initializing monitoring data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
