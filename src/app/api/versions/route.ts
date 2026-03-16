import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Version {
  id: string;
  siteId: string;
  versionNumber: number;
  commitHash: string;
  commitMessage: string;
  branch: string;
  size: number;
  timestamp: number;
  createdBy: string;
  status: 'released' | 'staging' | 'archived';
  changelog?: string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const siteId = request.nextUrl.searchParams.get('siteId');
    console.log('📡 [VERSIONS] GET request - user:', userId, 'site:', siteId);

    if (!userId) {
      console.log('❌ [VERSIONS] No user ID provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let q;
    if (siteId) {
      q = query(
        collection(db, 'users', userId, 'versions'),
        where('siteId', '==', siteId)
      );
    } else {
      q = collection(db, 'users', userId, 'versions');
    }

    const snapshot = await getDocs(q);
    const versions: Version[] = [];

    snapshot.forEach(doc => {
      versions.push({ id: doc.id, ...doc.data() } as Version);
    });

    // Trier par version décroissante
    versions.sort((a, b) => b.versionNumber - a.versionNumber);
    console.log('✅ [VERSIONS] Found', versions.length, 'versions in Firestore', {
      userId,
      siteId,
      versions: versions.map(v => ({
        versionNumber: v.versionNumber,
        commitHash: v.commitHash.substring(0, 8),
        status: v.status,
        timestamp: new Date(v.timestamp).toISOString()
      }))
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      siteId,
      commitHash,
      commitMessage,
      branch,
      size,
      changelog,
    } = await request.json();

    if (!siteId || !commitHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer le numéro de version suivant
    const existingVersions = await getDocs(
      query(
        collection(db, 'users', userId, 'versions'),
        where('siteId', '==', siteId)
      )
    );

    const maxVersion = existingVersions.docs.reduce((max, doc) => {
      const data = doc.data() as Version;
      return Math.max(max, data.versionNumber || 0);
    }, 0);

    const versionId = `v${maxVersion + 1}`;
    const version: Version = {
      id: versionId,
      siteId,
      versionNumber: maxVersion + 1,
      commitHash,
      commitMessage: commitMessage || 'Release version',
      branch: branch || 'main',
      size: size || 0,
      timestamp: Date.now(),
      createdBy: userId,
      status: 'released',
      changelog,
    };

    // Sauvegarder la version
    await setDoc(
      doc(db, 'users', userId, 'versions', versionId),
      version
    );

    return NextResponse.json({
      success: true,
      message: `Version ${versionId} créée avec succès`,
      version,
    });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
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

    const { versionId, siteId, status } = await request.json();

    if (!versionId || !siteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer et mettre à jour la version
    const docRef = doc(db, 'users', userId, 'versions', versionId);
    const docSnap = await getDocs(
      query(
        collection(db, 'users', userId, 'versions'),
        where('id', '==', versionId)
      )
    );

    if (docSnap.empty) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const version = docSnap.docs[0].data() as Version;
    version.status = status as Version['status'];

    return NextResponse.json({
      success: true,
      message: `Version ${versionId} mise à jour`,
      version,
    });
  } catch (error) {
    console.error('Error updating version:', error);
    return NextResponse.json(
      { error: 'Failed to update version' },
      { status: 500 }
    );
  }
}
