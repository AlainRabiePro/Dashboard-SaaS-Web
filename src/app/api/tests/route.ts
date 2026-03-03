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

    // Générer des résultats de tests réalistes
    const testResults = [
      {
        id: 'test-1',
        name: 'Unit: Authentication',
        status: 'passed',
        duration: 234,
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
      {
        id: 'test-2',
        name: 'Unit: API Endpoints',
        status: 'passed',
        duration: 567,
        timestamp: new Date(Date.now() - 1.5 * 3600000).toISOString(),
      },
      {
        id: 'test-3',
        name: 'Integration: Database',
        status: 'passed',
        duration: 890,
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: 'test-4',
        name: 'E2E: User Flow',
        status: 'failed',
        duration: 1230,
        timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        error: 'Timeout waiting for element .submit-button',
      },
      {
        id: 'test-5',
        name: 'Performance: Load Time',
        status: 'passed',
        duration: 345,
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 'test-6',
        name: 'Security: XSS Prevention',
        status: 'passed',
        duration: 456,
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      },
      {
        id: 'test-7',
        name: 'Integration: Email Service',
        status: 'passed',
        duration: 678,
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'test-8',
        name: 'Unit: Form Validation',
        status: 'passed',
        duration: 234,
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];

    const passedCount = testResults.filter(t => t.status === 'passed').length;
    const failedCount = testResults.filter(t => t.status === 'failed').length;
    const totalDuration = testResults.reduce((sum, t) => sum + t.duration, 0);

    // Timeline (commits/deployments avec tests)
    const timeline = [
      {
        id: 'commit-1',
        message: 'Fix authentication bug',
        author: 'dev@example.com',
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
        tests: 8,
        passed: 8,
        failed: 0,
      },
      {
        id: 'commit-2',
        message: 'Add new API endpoint',
        author: 'dev@example.com',
        timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        tests: 8,
        passed: 7,
        failed: 1,
      },
      {
        id: 'commit-3',
        message: 'Update database schema',
        author: 'dev@example.com',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        tests: 8,
        passed: 8,
        failed: 0,
      },
    ];

    return NextResponse.json({
      results: testResults,
      summary: {
        total: testResults.length,
        passed: passedCount,
        failed: failedCount,
        successRate: ((passedCount / testResults.length) * 100).toFixed(1),
        totalDuration,
        avgDuration: Math.floor(totalDuration / testResults.length),
      },
      timeline,
    });
  } catch (error: any) {
    console.error('Error fetching test results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
