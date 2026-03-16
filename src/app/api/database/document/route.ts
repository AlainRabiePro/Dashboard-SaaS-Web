import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, setDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';
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
const firestore = getFirestore(app);

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const { collection: collectionName, documentId, data, action } = await request.json();

  if (!userId || !collectionName || !action) {
    return NextResponse.json(
      { error: 'Paramètres manquants' },
      { status: 400 }
    );
  }

  try {
    const collectionRef = `users/${userId}/${collectionName}`;

    switch (action) {
      case 'save': // Créer ou mettre à jour
        if (!documentId || !data) {
          return NextResponse.json(
            { error: 'documentId et data requis pour save' },
            { status: 400 }
          );
        }
        return await handleSaveDocument(collectionRef, documentId, data);

      case 'delete': // Supprimer
        if (!documentId) {
          return NextResponse.json(
            { error: 'documentId requis pour delete' },
            { status: 400 }
          );
        }
        return await handleDeleteDocument(collectionRef, documentId);

      case 'get': // Récupérer un document
        if (!documentId) {
          return NextResponse.json(
            { error: 'documentId requis pour get' },
            { status: 400 }
          );
        }
        return await handleGetDocument(collectionRef, documentId);

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in document operation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'opération', details: String(error) },
      { status: 500 }
    );
  }
}

async function handleSaveDocument(collectionPath: string, documentId: string, data: any) {
  try {
    const docRef = doc(firestore, collectionPath, documentId);
    await setDoc(docRef, data, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Document sauvegardé',
      documentId,
    });
  } catch (error: any) {
    console.error('Error saving document:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleDeleteDocument(collectionPath: string, documentId: string) {
  try {
    const docRef = doc(firestore, collectionPath, documentId);
    
    // Vérifier que le document existe
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: 'Document supprimé',
      documentId,
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleGetDocument(collectionPath: string, documentId: string) {
  try {
    const docRef = doc(firestore, collectionPath, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: docSnap.id,
      data: docSnap.data(),
    });
  } catch (error: any) {
    console.error('Error getting document:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
