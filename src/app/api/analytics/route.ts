import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
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

async function initializeAnalytics(userId: string) {
  const analyticsRef = collection(db, 'users', userId, 'analytics');
  
  // Generate 30 days of analytics data
  const analyticsData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    analyticsData.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 500) + 100,
      users: Math.floor(Math.random() * 200) + 30,
      sessions: Math.floor(Math.random() * 300) + 50,
      avgSessionDuration: Math.floor(Math.random() * 300) + 60,
      bounceRate: (Math.random() * 40 + 20).toFixed(1),
      conversionRate: (Math.random() * 5 + 1).toFixed(2),
      timestamp: Timestamp.fromDate(date),
    });
  }

  for (const data of analyticsData) {
    await addDoc(analyticsRef, data).catch(err => console.error('Error adding analytics:', err));
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyticsRef = collection(db, 'users', userId, 'analytics');
    const analyticsSnap = await getDocs(analyticsRef);

    if (analyticsSnap.empty) {
      await initializeAnalytics(userId);
      const analyticsSnap2 = await getDocs(analyticsRef);
      const data = analyticsSnap2.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any,
      }));
      return processAnalytics(data);
    }

    const data = analyticsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
    }));

    return processAnalytics(data);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function processAnalytics(data: any[]) {
  const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalViews = sorted.reduce((sum, d) => sum + (d.views || 0), 0);
  const totalUsers = sorted.reduce((sum, d) => sum + (d.users || 0), 0);
  const avgSessionDuration = Math.round(
    sorted.reduce((sum, d) => sum + (d.avgSessionDuration || 0), 0) / sorted.length
  );
  const avgBounceRate = (
    sorted.reduce((sum, d) => sum + parseFloat(d.bounceRate || 0), 0) / sorted.length
  ).toFixed(1);
  const avgConversionRate = (
    sorted.reduce((sum, d) => sum + parseFloat(d.conversionRate || 0), 0) / sorted.length
  ).toFixed(2);

  return NextResponse.json({
    analytics: sorted,
    summary: {
      totalViews,
      totalUsers,
      avgSessionDuration,
      avgBounceRate,
      avgConversionRate,
    },
    topPages: [
      { path: '/', views: 2450, bounceRate: '32.5%' },
      { path: '/pricing', views: 1840, bounceRate: '28.3%' },
      { path: '/features', views: 1620, bounceRate: '25.1%' },
      { path: '/docs', views: 1245, bounceRate: '18.7%' },
      { path: '/blog', views: 890, bounceRate: '35.2%' },
    ],
    referrers: [
      { source: 'Google', users: 3500, percentage: 45.2 },
      { source: 'Direct', users: 2100, percentage: 27.1 },
      { source: 'Facebook', users: 1200, percentage: 15.5 },
      { source: 'Twitter', users: 680, percentage: 8.8 },
      { source: 'LinkedIn', users: 420, percentage: 5.4 },
    ],
    devices: [
      { device: 'Mobile', users: 4200, percentage: 54.3 },
      { device: 'Desktop', users: 2800, percentage: 36.1 },
      { device: 'Tablet', users: 620, percentage: 8.0 },
    ],
  });
}
