import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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
    const level = request.nextUrl.searchParams.get('level') || 'all';
    const limit_param = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    // Récupérer les vrais logs de Firestore
    let logsRef;
    if (siteId) {
      logsRef = collection(db, 'users', userId, 'sites', siteId, 'logs');
    } else {
      logsRef = collection(db, 'users', userId, 'logs');
    }

    let logsQuery = query(logsRef, orderBy('timestamp', 'desc'));
    const logsSnap = await getDocs(logsQuery);
    
    let logs = logsSnap.docs.map(doc => ({
      timestamp: doc.data().timestamp,
      level: doc.data().level,
      message: doc.data().message,
      source: doc.data().source,
    }));

    // Filtrer par niveau si demandé
    if (level !== 'all') {
      logs = logs.filter(l => l.level === level);
    }

    const errorCount = logs.filter(l => l.level === 'error').length;
    const warningCount = logs.filter(l => l.level === 'warn').length;

    return NextResponse.json({
      logs: logs.slice(0, limit_param),
      summary: {
        total: logs.length,
        errors: errorCount,
        warnings: warningCount,
        lastError: logs.find(l => l.level === 'error')?.timestamp || null,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
