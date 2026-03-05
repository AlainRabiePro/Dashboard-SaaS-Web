import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

/**
 * API pour gérer le statut des commandes de domaine
 * Permet de mettre à jour le statut après paiement Stripe
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

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status, stripeSessionId, paymentId } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'orderId et status sont requis' },
        { status: 400 }
      );
    }

    // Valider le status
    if (!['pending', 'paid', 'expired'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalide. Doit être: pending, paid ou expired' },
        { status: 400 }
      );
    }

    const orderRef = doc(db, 'domain_orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'ordre appartient à l'utilisateur
    const orderData = orderSnap.data();
    if (!orderData || orderData.userId !== userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Mettre à jour le statut
    const updateData: any = { status, updatedAt: new Date() };
    
    if (stripeSessionId) {
      updateData.stripeSessionId = stripeSessionId;
    }
    
    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    await updateDoc(orderRef, updateData);

    console.log(`✅ Commande ${orderId} mise à jour: ${status}`);

    return NextResponse.json({
      success: true,
      orderId,
      status,
      message: `Commande marquée comme ${status === 'paid' ? 'payée' : status}`,
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// GET : récupérer une commande spécifique
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId requis' },
        { status: 400 }
      );
    }

    const orderRef = doc(db, 'domain_orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'ordre appartient à l'utilisateur
    const orderDataGet = orderSnap.data();
    if (!orderDataGet || orderDataGet.userId !== userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(orderDataGet);
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

// DELETE : supprimer/annuler une commande
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId requis' },
        { status: 400 }
      );
    }

    const orderRef = doc(db, 'domain_orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'ordre appartient à l'utilisateur
    const orderDataDel = orderSnap.data();
    if (!orderDataDel || orderDataDel.userId !== userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que la commande est encore en pending
    if (orderDataDel.status !== 'pending') {
      return NextResponse.json(
        { error: `Impossible d'annuler une commande ${orderDataDel.status}` },
        { status: 400 }
      );
    }

    // Marquer comme expirée au lieu de supprimer
    await updateDoc(orderRef, { 
      status: 'expired',
      cancelledAt: new Date() 
    });

    console.log(`✅ Commande ${orderId} annulée`);

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Commande annulée',
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}
