import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * POST /api/paypal/create-order
 * Crée une commande PayPal pour un plan d'abonnement
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { planId, planName, amount, description } = await request.json();

    if (!userId || !planId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { firestore: db } = initializeFirebase();

    // Récupérer l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Créer une commande PayPal
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET_KEY;

    if (!paypalClientId || !paypalSecret) {
      console.error('PayPal credentials not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Encoder les credentials en base64
    const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');

    // Appel à PayPal API pour créer une commande
    const orderResponse = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value: (amount / 100).toFixed(2), // Convertir centimes en euros
            },
            description: description || `${planName} Plan - Monthly Subscription`,
            custom_id: planId,
          },
        ],
        payer: {
          email_address: userDoc.data().email,
        },
        application_context: {
          brand_name: 'SaasFlow',
          locale: 'fr-FR',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?paypal_success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('PayPal API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create PayPal order', details: errorData },
        { status: 400 }
      );
    }

    const order = await orderResponse.json();

    // Sauvegarder la commande dans Firestore
    await updateDoc(userRef, {
      'paypalOrders': {
        [order.id]: {
          planId,
          planName,
          amount,
          status: 'CREATED',
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.now().toDate().getTime() + 3 * 60 * 60 * 1000, // 3 heures
        },
      },
    });

    // Trouver le lien d'approbation
    const approvalLink = order.links.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl: approvalLink,
    });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', message: error.message },
      { status: 500 }
    );
  }
}
