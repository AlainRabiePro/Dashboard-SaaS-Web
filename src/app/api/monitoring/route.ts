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

    const siteId = request.nextUrl.searchParams.get('siteId');

    // Récupérer les sites avec leurs données de monitoring réelles
    const sitesRef = collection(db, 'users', userId, 'sites');
    const sitesSnap = await getDocs(sitesRef);
    
    let sites = sitesSnap.docs.map(doc => {
      const data = doc.data();
      const metrics = data.metrics || {};
      
      return {
        id: doc.id,
        name: data.name || data.domain || `site-${doc.id.substring(0, 8)}.example.com`,
        domain: data.domain,
        uptime: metrics.uptime ?? 0,
        latency: metrics.latency ?? 0,
        errorRate: metrics.errorRate ?? 0,
        status: metrics.status || 'unknown',
        lastCheck: metrics.lastCheck || null,
      };
    });

    // Si un siteId est spécifié, filtrer les données de ce site uniquement
    if (siteId) {
      sites = sites.filter(s => s.id === siteId);
    }

    const totalUptime = sites.length > 0 
      ? (sites.reduce((sum, s) => sum + s.uptime, 0) / sites.length).toFixed(1)
      : 0;

    const avgLatency = sites.length > 0
      ? Math.floor(sites.reduce((sum, s) => sum + s.latency, 0) / sites.length)
      : 0;

    const avgErrorRate = sites.length > 0
      ? (sites.reduce((sum, s) => sum + s.errorRate, 0) / sites.length).toFixed(2)
      : 0;

    const alertCount = sites.filter(s => s.status === 'critical' || s.status === 'warning').length;

    return NextResponse.json({ 
      sites,
      summary: {
        uptime: parseFloat(totalUptime as string),
        latency: avgLatency,
        errorRate: parseFloat(avgErrorRate as string),
        alerts: alertCount,
      }
    });
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
