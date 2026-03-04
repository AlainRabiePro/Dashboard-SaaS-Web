import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

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

    const appName = `backup-${siteId}-${Date.now()}`;
    let app;
    
    if (!getApps().find(a => a.name === appName)) {
      app = initializeApp(firebaseConfig, appName);
    } else {
      app = getApps().find(a => a.name === appName)!;
    }

    const db = getFirestore(app);
    const timestamp = new Date().toISOString();
    const backupId = `backup-${new Date().getTime()}`;

    // Fetch all collections
    const backupData: any = {
      id: backupId,
      timestamp,
      siteId,
      type,
      collections: []
    };

    try {
      const sitesRef = collection(db, 'users', userId, 'sites', siteId, 'data');
      const snapshot = await getDocs(sitesRef);

      if (snapshot.size > 0) {
        snapshot.forEach(doc => {
          backupData.collections.push({
            name: doc.id,
            data: doc.data(),
          });
        });
      }
    } catch (e) {
      console.log('Fetching for backup error:', e);
    }

    // Store backup in Firestore under backups collection
    try {
      const backupsRef = collection(db, 'users', userId, 'sites', siteId, 'backups');
      await setDoc(doc(backupsRef, backupId), {
        timestamp,
        size: JSON.stringify(backupData).length,
        collectionCount: backupData.collections.length,
        status: 'completed',
        data: backupData,
        createdAt: new Date(),
      });
    } catch (backupError) {
      console.error('Failed to save backup:', backupError);
    }

    return NextResponse.json({
      success: true,
      backupId,
      timestamp,
      collectionCount: backupData.collections.length,
      message: `Backup créé avec succès (${backupData.collections.length} collections)`,
    });

  } catch (error) {
    console.error('[BACKUP] Error:', error);
    return NextResponse.json(
      { error: 'Backup failed', details: String(error) },
      { status: 500 }
    );
  }
}
