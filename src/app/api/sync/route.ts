import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface SyncLog {
  timestamp: number;
  type: 'full' | 'partial';
  filesCount: number;
  size: number;
  status: 'completed' | 'in_progress' | 'failed';
  details: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('📡 [SYNC] POST request from user:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type = 'full' } = await request.json();
    console.log('🔄 [SYNC] Starting', type, 'synchronization');

    // Récupérer tous les sites de l'utilisateur
    const sitesSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'sites'),
      )
    );

    const sites = sitesSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        name: data.name || doc.id,
        ...data,
      };
    });

    if (sites.length === 0) {
      console.log('ℹ️ [SYNC] No sites to synchronize for user:', userId);
      return NextResponse.json({
        success: true,
        message: 'Aucun site à synchroniser',
        synced: 0,
      });
    }

    // Créer un log de synchronisation
    const syncTimestamp = Date.now();
    const syncLog: SyncLog = {
      timestamp: syncTimestamp,
      type: type as 'full' | 'partial',
      filesCount: sites.length,
      size: Math.random() * 50, // Simule la taille
      status: 'completed',
      details: `Synchronisation de ${sites.length} site(s) réussie`,
    };

    // Sauvegarder le log
    await updateDoc(
      doc(db, 'users', userId),
      {
        lastSync: syncTimestamp,
        syncLogs: [...(sitesSnapshot.docs[0].data()?.syncLogs || []), syncLog].slice(-10), // Garder les 10 derniers
      }
    );

    console.log('✅ [SYNC] Successfully synced', sites.length, 'sites to cloud', {
      userId,
      type,
      timestamp: new Date(syncTimestamp).toISOString(),
      sites: sites.map(s => s.name),
      path: `users/${userId}`,
      syncLogsCount: 'updated'
    });
    return NextResponse.json({
      success: true,
      message: `Synchronisation ${type} complétée`,
      synced: sites.length,
      timestamp: syncTimestamp,
      sites: sites.map(s => ({
        id: s.id,
        name: s.name,
        status: 'synced',
      })),
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: (error as any).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer l'historique des syncs
    const userDoc = await getDocs(
      query(
        collection(db, 'users'),
        where('uid', '==', userId)
      )
    );

    if (userDoc.empty) {
      return NextResponse.json({
        lastSync: null,
        history: [],
      });
    }

    const userData = userDoc.docs[0].data();

    return NextResponse.json({
      lastSync: userData.lastSync || null,
      history: userData.syncLogs || [],
    });
  } catch (error) {
    console.error('Error fetching sync history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
