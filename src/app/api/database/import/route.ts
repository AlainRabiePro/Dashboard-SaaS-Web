import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { siteId, importData } = await request.json();

    if (!userId || !siteId || !importData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const appName = `import-${siteId}-${Date.now()}`;
    let app;
    
    if (!getApps().find(a => a.name === appName)) {
      app = initializeApp(firebaseConfig, appName);
    } else {
      app = getApps().find(a => a.name === appName)!;
    }

    const db = getFirestore(app);

    // Import collections and documents
    let importedCount = 0;
    let errorCount = 0;

    if (importData.collections && Array.isArray(importData.collections)) {
      for (const col of importData.collections) {
        try {
          const colRef = collection(db, 'users', userId, 'sites', siteId, 'data');
          await setDoc(doc(colRef, col.name), col.data);
          importedCount++;
        } catch (e) {
          console.error(`Failed to import collection ${col.name}:`, e);
          errorCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      errorCount,
      message: `${importedCount} collection(s) imported${errorCount > 0 ? `, ${errorCount} error(s)` : ''}`,
    });

  } catch (error) {
    console.error('[IMPORT] Error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: String(error) },
      { status: 500 }
    );
  }
}
