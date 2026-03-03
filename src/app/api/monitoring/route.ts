import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer les sites pour avoir les données de monitoring
    const sitesRef = collection(db, 'users', userId, 'sites');
    const sitesSnap = await getDocs(sitesRef);
    
    const sites = sitesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: doc.id,
        // Données de monitoring par défaut (à connecter avec vrai monitoring)
        uptime: 99.8 + Math.random() * 0.2,
        latency: Math.floor(100 + Math.random() * 200),
        errorRate: Math.random() * 0.5,
        status: data.status || 'healthy',
      };
    });

    const totalUptime = sites.length > 0 
      ? (sites.reduce((sum, s) => sum + s.uptime, 0) / sites.length).toFixed(1)
      : 99.8;

    const avgLatency = sites.length > 0
      ? Math.floor(sites.reduce((sum, s) => sum + s.latency, 0) / sites.length)
      : 150;

    return NextResponse.json({ 
      sites,
      summary: {
        uptime: parseFloat(totalUptime as string),
        latency: avgLatency,
        errorRate: 0.12,
        alerts: 3,
      }
    });
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
