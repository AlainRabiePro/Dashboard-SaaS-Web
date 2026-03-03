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

    // Générer des logs réalistes
    const logs = [];
    const logLevels = ['info', 'warn', 'error', 'debug'];
    const messages = [
      'Application started successfully',
      'Database connection established',
      'Cache initialized',
      'API server listening on port 3000',
      'Failed to fetch user data',
      'Request timeout after 30s',
      'Invalid API key provided',
      'SSL certificate expired',
      'Memory usage at 85%',
      'Backup completed successfully',
      'Rate limit exceeded',
      'Service degradation detected',
    ];

    const now = Date.now();
    for (let i = 0; i < 50; i++) {
      const logLevel = logLevels[Math.floor(Math.random() * logLevels.length)];
      
      if (level !== 'all' && level !== logLevel) continue;
      
      logs.push({
        timestamp: new Date(now - i * 30000).toISOString(),
        level: logLevel,
        message: messages[Math.floor(Math.random() * messages.length)],
        source: ['API', 'Database', 'Worker', 'Frontend'][Math.floor(Math.random() * 4)],
      });
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
    console.error('Error fetching console logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
