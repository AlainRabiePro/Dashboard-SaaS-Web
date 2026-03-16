import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Backup {
  id: string;
  siteId: string;
  timestamp: number;
  commitHash: string;
  commitMessage: string;
  size: number;
  status: 'completed' | 'in_progress' | 'failed';
  createdAt: number;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const siteId = request.nextUrl.searchParams.get('siteId');
    console.log('📡 [BACKUP] GET request - user:', userId, 'site:', siteId);

    if (!userId) {
      console.log('❌ [BACKUP] No user ID provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let q;
    if (siteId) {
      q = query(
        collection(db, 'users', userId, 'backups'),
        where('siteId', '==', siteId)
      );
    } else {
      q = collection(db, 'users', userId, 'backups');
    }

    const snapshot = await getDocs(q);
    const backups: Backup[] = [];

    snapshot.forEach(doc => {
      backups.push({ id: doc.id, ...doc.data() } as Backup);
    });

    // Trier par date décroissante
    backups.sort((a, b) => b.timestamp - a.timestamp);
    console.log('✅ [BACKUP] Found', backups.length, 'backups in Firestore', {
      userId,
      siteId,
      backups: backups.map(b => ({
        id: b.id,
        commitHash: b.commitHash.substring(0, 8),
        timestamp: new Date(b.timestamp).toISOString(),
        size: `${(b.size / 1024).toFixed(2)}KB`
      }))
    });

    return NextResponse.json(backups);
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('📡 [BACKUP] POST request from user:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { siteId, commitHash, commitMessage, size } = await request.json();

    if (!siteId || !commitHash) {
      console.log('❌ [BACKUP] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const backupId = `backup-${Date.now()}`;
    const backup: Backup = {
      id: backupId,
      siteId,
      timestamp: Date.now(),
      commitHash,
      commitMessage: commitMessage || 'Manual backup',
      size: size || 0,
      status: 'completed',
      createdAt: Date.now(),
    };

    // Sauvegarder le backup
    await setDoc(
      doc(db, 'users', userId, 'backups', backupId),
      backup
    );

    console.log('✅ [BACKUP] Successfully created backup:', backupId, {
      userId,
      siteId,
      commitHash: commitHash.substring(0, 8),
      timestamp: new Date(backup.timestamp).toISOString(),
      path: `users/${userId}/backups/${backupId}`,
      size: `${(size / 1024).toFixed(2)}KB`
    });
    return NextResponse.json({
      success: true,
      message: 'Backup créé avec succès',
      backup,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { backupId, siteId } = await request.json();

    if (!backupId || !siteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer le backup
    const docRef = doc(db, 'users', userId, 'backups', backupId);
    const docSnap = await getDocs(
      query(
        collection(db, 'users', userId, 'backups'),
        where('id', '==', backupId)
      )
    );

    if (docSnap.empty) {
      return NextResponse.json(
        { error: 'Backup not found' },
        { status: 404 }
      );
    }

    const backup = docSnap.docs[0].data() as Backup;

    return NextResponse.json({
      success: true,
      message: `Restauration du backup ${backup.commitHash} en cours`,
      backup,
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
