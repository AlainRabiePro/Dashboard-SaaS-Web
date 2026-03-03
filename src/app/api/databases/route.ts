import { NextRequest, NextResponse } from 'next/server';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
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

/**
 * GET: Récupérer les bases de données d'un utilisateur
 * POST: Ajouter une nouvelle base de données
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const q = query(
      collection(db, 'databases'),
      where('userId', '==', userId)
    );

    const snap = await getDocs(q);
    const databases = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ databases });
  } catch (error: any) {
    console.error('Error fetching databases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, config, isDefault = false } = body;

    if (!userId || !name || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name, config' },
        { status: 400 }
      );
    }

    // Vérifier que la config a tous les champs requis
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const hasAllFields = requiredFields.every(field => config[field]);
    if (!hasAllFields) {
      return NextResponse.json(
        { error: 'Invalid config: missing required Firebase fields' },
        { status: 400 }
      );
    }

    // Si isDefault=true, retirer le default des autres
    if (isDefault) {
      const q = query(
        collection(db, 'databases'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      const snap = await getDocs(q);
      for (const doc of snap.docs) {
        await updateDoc(doc.ref, { isDefault: false });
      }
    }

    // Ajouter la nouvelle base
    const newDb = await addDoc(collection(db, 'databases'), {
      userId,
      name,
      config,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: newDb.id,
      userId,
      name,
      config,
      isDefault,
      createdAt: new Date(),
    });
  } catch (error: any) {
    console.error('Error creating database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT: Mettre à jour une base de données
 * DELETE: Supprimer une base de données
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { databaseId, name, isDefault } = body;

    if (!databaseId) {
      return NextResponse.json({ error: 'Missing databaseId' }, { status: 400 });
    }

    const dbRef = doc(db, 'databases', databaseId);
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;

      // Si isDefault=true, retirer le default des autres
      if (isDefault) {
        const snap = await getDocs(
          query(
            collection(db, 'databases'),
            where('isDefault', '==', true)
          )
        );
        for (const doc of snap.docs) {
          if (doc.id !== databaseId) {
            await updateDoc(doc.ref, { isDefault: false });
          }
        }
      }
    }

    await updateDoc(dbRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { databaseId } = await request.json();

    if (!databaseId) {
      return NextResponse.json({ error: 'Missing databaseId' }, { status: 400 });
    }

    const dbRef = doc(db, 'databases', databaseId);
    await deleteDoc(dbRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
