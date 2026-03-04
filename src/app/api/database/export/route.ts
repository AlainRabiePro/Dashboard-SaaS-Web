import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { siteId, type } = await request.json();

    if (!userId || !siteId) {
      return NextResponse.json(
        { error: 'Missing userId or siteId' },
        { status: 400 }
      );
    }

    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const appName = `export-${siteId}-${Date.now()}`;
    let app;
    
    if (!getApps().find(a => a.name === appName)) {
      app = initializeApp(firebaseConfig, appName);
    } else {
      app = getApps().find(a => a.name === appName)!;
    }

    const db = getFirestore(app);

    // Fetch all collections and their documents
    const exportData: any = {
      timestamp: new Date().toISOString(),
      siteId,
      type,
      collections: []
    };

    try {
      // Get user's sites collections
      const sitesRef = collection(db, 'users', userId, 'sites', siteId, 'data');
      const snapshot = await getDocs(sitesRef);

      if (snapshot.size > 0) {
        snapshot.forEach(doc => {
          exportData.collections.push({
            name: doc.id,
            data: doc.data(),
            timestamp: new Date().toISOString(),
          });
        });
      } else {
        // Try alternate structure
        const mainRef = collection(db, 'users', userId, 'sites', siteId);
        const mainSnapshot = await getDocs(mainRef);
        
        mainSnapshot.forEach(doc => {
          exportData.collections.push({
            name: doc.id,
            data: doc.data(),
          });
        });
      }
    } catch (e) {
      console.log('Fetching collections error:', e);
    }

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `backup-${siteId}-${new Date().toISOString().split('T')[0]}.json`,
    });

  } catch (error) {
    console.error('[EXPORT] Error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: String(error) },
      { status: 500 }
    );
  }
}
