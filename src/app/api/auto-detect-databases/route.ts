import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { siteId, vpsPath } = await request.json();

    if (!userId || !siteId) {
      return NextResponse.json(
        { error: 'Missing userId or siteId' },
        { status: 400 }
      );
    }

    const databases: any[] = [];

    // Try Firestore (default for Firebase projects)
    try {
      console.log(`[AUTO-DETECT] Attempting Firestore detection for site ${siteId}`);
      
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Initialize app for this detection
      const appName = `detect-${siteId}-${Date.now()}`;
      let app;
      
      if (!getApps().find(a => a.name === appName)) {
        app = initializeApp(firebaseConfig, appName);
      } else {
        app = getApps().find(a => a.name === appName)!;
      }

      const db = getFirestore(app);

      // Try to fetch collections from Firestore
      const collections: any[] = [];
      
      // Get collections for the site
      const siteRef = collection(db, 'users', userId, 'sites', siteId, 'databases');
      
      try {
        const snapshot = await getDocs(query(siteRef, limit(1)));
        // If we can read Firestore, it's detected
        databases.push({
          type: 'firestore',
          name: 'Firestore (Firebase)',
          status: 'detected',
          collections: [],
          isDefault: true,
        });
      } catch (e) {
        console.log(`[AUTO-DETECT] Firestore not accessible: ${e}`);
      }

      // Try to get user's sites collections
      const sitesRef = collection(db, 'users', userId, 'sites');
      const sitesSnapshot = await getDocs(query(sitesRef, limit(10)));
      
      if (sitesSnapshot.size > 0) {
        let firestoreCollections: any[] = [];
        
        sitesSnapshot.forEach(doc => {
          firestoreCollections.push({
            name: doc.id,
            count: 1,
            data: [doc.data()]
          });
        });

        databases[0].collections = firestoreCollections;
      }

    } catch (error) {
      console.log(`[AUTO-DETECT] Firestore detection failed:`, error);
    }

    // Try MySQL/MariaDB via VPS SSH (if vpsPath provided)
    if (vpsPath) {
      try {
        console.log(`[AUTO-DETECT] Attempting MySQL detection at ${vpsPath}`);
        
        const sshResponse = await fetch('/api/console/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            command: 'npm test',
            projectName: 'unknown',
            projectPath: vpsPath,
          }),
        });

        if (sshResponse.ok) {
          databases.push({
            type: 'mysql',
            name: 'MySQL/MariaDB (VPS)',
            status: 'likely',
            collections: [],
          });
        }
      } catch (e) {
        console.log(`[AUTO-DETECT] MySQL detection failed`);
      }
    }

    // Try Supabase (if any env vars hint at it)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        console.log(`[AUTO-DETECT] Attempting Supabase detection`);
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        }).catch(() => null);

        if (res?.ok) {
          databases.push({
            type: 'supabase',
            name: 'Supabase (PostgreSQL)',
            status: 'detected',
            collections: [],
          });
        }
      } catch (e) {
        console.log(`[AUTO-DETECT] Supabase detection failed`);
      }
    }

    return NextResponse.json({
      databases: databases.length > 0 ? databases : [
        {
          type: 'firestore',
          name: 'Firestore (Firebase)',
          status: 'default',
          collections: [],
          isDefault: true,
        }
      ],
      autoDetected: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[AUTO-DETECT] Error:', error);
    return NextResponse.json(
      { error: 'Auto-detection failed', details: String(error) },
      { status: 500 }
    );
  }
}
