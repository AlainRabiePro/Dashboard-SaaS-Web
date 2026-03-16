import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

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
      // ✅ FIXED: Get the site document first
      const siteDocRef = doc(db, 'users', userId, 'sites', siteId);
      const siteDocSnap = await getDoc(siteDocRef);

      if (siteDocSnap.exists()) {
        // Export the site document data
        exportData.siteData = siteDocSnap.data();
      }

      // Try to get any sub-collections of the site
      // Get user's other collections (domains, logs, etc)
      const collectionsToExport = ['domains', 'logs', 'settings', 'backups'];
      
      for (const collName of collectionsToExport) {
        try {
          const collRef = collection(db, 'users', userId, collName);
          const snapshot = await getDocs(collRef);

          if (snapshot.size > 0) {
            const collData: any[] = [];
            snapshot.forEach(doc => {
              collData.push({
                id: doc.id,
                data: doc.data(),
              });
            });

            if (collData.length > 0) {
              exportData.collections.push({
                name: collName,
                documents: collData,
                count: collData.length,
              });
            }
          }
        } catch (e) {
          console.warn(`⚠️  Collection "${collName}" not accessible or doesn't exist:`, e);
        }
      }
    } catch (e) {
      console.error('Error fetching collections:', e);
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
