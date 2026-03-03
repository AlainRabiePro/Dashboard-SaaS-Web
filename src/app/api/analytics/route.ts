import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
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

    // Récupérer les analytics réelles de Firestore
    let analyticsRef;
    if (siteId) {
      analyticsRef = collection(db, 'users', userId, 'sites', siteId, 'analytics');
    } else {
      analyticsRef = collection(db, 'users', userId, 'analytics');
    }
    
    const analyticsSnap = await getDocs(query(analyticsRef, orderBy('date', 'desc')));
    const analytics = analyticsSnap.docs.map(doc => ({
      date: doc.data().date,
      views: doc.data().views || 0,
      users: doc.data().users || 0,
      avgSessionDuration: doc.data().avgSessionDuration || 0,
      bounceRate: doc.data().bounceRate || '0',
    }));

    // Statistiques globales
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalUsers = analytics.reduce((sum, a) => sum + a.users, 0);
    const avgBounce = analytics.length > 0 
      ? (analytics.reduce((sum, a) => sum + parseFloat(a.bounceRate), 0) / analytics.length).toFixed(1)
      : '0';
    const avgSessionDuration = analytics.length > 0
      ? Math.floor(analytics.reduce((sum, a) => sum + a.avgSessionDuration, 0) / analytics.length)
      : 0;

    // Top pages depuis Firestore
    const topPagesRef = collection(db, 'users', userId, 'analytics', 'pages', 'top');
    const topPagesSnap = await getDocs(query(topPagesRef, orderBy('views', 'desc')));
    const topPages = topPagesSnap.docs.map(doc => ({
      path: doc.data().path,
      views: doc.data().views || 0,
    }));

    // Referrers depuis Firestore
    const referrersRef = collection(db, 'users', userId, 'analytics', 'referrers', 'sources');
    const referrersSnap = await getDocs(query(referrersRef, orderBy('users', 'desc')));
    const referrers = referrersSnap.docs.map(doc => ({
      source: doc.data().source,
      users: doc.data().users || 0,
    }));

    return NextResponse.json({
      analytics,
      summary: {
        totalViews,
        totalUsers,
        avgSessionDuration,
        avgBounceRate: parseFloat(avgBounce),
      },
      topPages,
      referrers,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
