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

    // Récupérer les vrais résultats de tests depuis Firestore
    const testsRef = collection(db, 'users', userId, 'tests');
    const testsSnap = await getDocs(query(testsRef, orderBy('timestamp', 'desc')));
    
    const testResults = testsSnap.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      status: doc.data().status,
      duration: doc.data().duration || 0,
      timestamp: doc.data().timestamp,
      error: doc.data().error,
    }));

    const passedCount = testResults.filter(t => t.status === 'passed').length;
    const failedCount = testResults.filter(t => t.status === 'failed').length;
    const totalDuration = testResults.reduce((sum, t) => sum + t.duration, 0);

    // Timeline depuis Firestore
    const timelineRef = collection(db, 'users', userId, 'tests', 'timeline', 'commits');
    const timelineSnap = await getDocs(query(timelineRef, orderBy('timestamp', 'desc')));
    const timeline = timelineSnap.docs.map(doc => ({
      id: doc.id,
      message: doc.data().message,
      author: doc.data().author,
      timestamp: doc.data().timestamp,
      tests: doc.data().tests || 0,
      passed: doc.data().passed || 0,
      failed: doc.data().failed || 0,
    }));

    return NextResponse.json({
      results: testResults,
      summary: {
        total: testResults.length,
        passed: passedCount,
        failed: failedCount,
        successRate: testResults.length > 0 ? ((passedCount / testResults.length) * 100).toFixed(1) : '0',
        totalDuration,
        avgDuration: testResults.length > 0 ? Math.floor(totalDuration / testResults.length) : 0,
      },
      timeline,
    });
  } catch (error: any) {
    console.error('Error fetching test results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
