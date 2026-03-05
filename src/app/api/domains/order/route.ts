import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

/**
 * API pour commander un domaine
 * Crée une commande en attente de paiement
 */

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

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, price } = body;

    if (!domain || !price) {
      return NextResponse.json(
        { error: 'domain et price sont requis' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Le prix doit être un nombre positif' },
        { status: 400 }
      );
    }

    // Vérifier que le domaine n'a pas déjà été commandé
    const q = query(
      collection(db, 'domain_orders'),
      where('domain', '==', domain),
      where('status', 'in', ['pending', 'paid'])
    );
    const existingOrder = await getDocs(q);

    if (!existingOrder.empty) {
      return NextResponse.json(
        {
          error: 'Ce domaine a déjà été commandé',
          code: 'DOMAIN_ALREADY_ORDERED',
        },
        { status: 409 }
      );
    }

    // Créer la commande
    const orderRef = await addDoc(collection(db, 'domain_orders'), {
      userId,
      domain,
      price,
      status: 'pending', // pending, paid, expired
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire dans 24h
      paymentId: null,
      stripeSessionId: null,
    });

    console.log(`✅ Commande créée pour ${domain} (${orderRef.id})`);

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      domain,
      price,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la commande' },
      { status: 500 }
    );
  }
}

// GET : récupérer les commandes de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const q = query(
      collection(db, 'domain_orders'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Date ? doc.data().createdAt : new Date(doc.data().createdAt),
      expiresAt: doc.data().expiresAt instanceof Date ? doc.data().expiresAt : new Date(doc.data().expiresAt),
    }));

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}
