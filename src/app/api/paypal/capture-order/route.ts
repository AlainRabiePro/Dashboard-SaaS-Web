import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, Timestamp, collection, setDoc } from 'firebase/firestore';

/**
 * POST /api/paypal/capture-order
 * Capture une commande PayPal après approbation de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { orderId } = await request.json();

    if (!userId || !orderId) {
      return NextResponse.json(
        { error: 'Missing userId or orderId' },
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

    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET_KEY;

    if (!paypalClientId || !paypalSecret) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64');

    // Capturer la commande
    const captureResponse = await fetch(
      `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture error:', errorData);
      return NextResponse.json(
        { error: 'Failed to capture payment', details: errorData },
        { status: 400 }
      );
    }

    const capturedOrder = await captureResponse.json();
    const purchase = capturedOrder.purchase_units[0];
    const planId = purchase.custom_id;

    // Mettre à jour le plan de l'utilisateur
    const planPrices: Record<string, number> = {
      basic: 5,
      professional: 10,
      enterprise: 17,
    };

    const planStorage: Record<string, number> = {
      basic: 5,
      professional: 15,
      enterprise: 100,
    };

    await updateDoc(userRef, {
      'subscription.plan': planId,
      'subscription.status': 'active',
      'subscription.currentPeriodStart': Timestamp.now(),
      'subscription.currentPeriodEnd': new Timestamp(
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        0
      ),
      'subscription.paypalOrderId': orderId,
      'subscription.paypalCustomerId': capturedOrder.payer.email_address,
      'storageLimit': planStorage[planId] || 5,
      'plan': planId,
    });

    // Créer une facture
    const invoicesRef = collection(db, 'users', userId, 'invoices');
    const invoiceId = `INV-${Date.now()}`;
    
    await setDoc(doc(invoicesRef, invoiceId), {
      orderId,
      planId,
      amount: parseFloat(purchase.amount.value) * 100, // En centimes
      currency: 'EUR',
      status: 'paid',
      paymentMethod: 'paypal',
      paidAt: Timestamp.now(),
      payer: {
        email: capturedOrder.payer.email_address,
        name: capturedOrder.payer.name?.given_name,
      },
    });

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Payment captured successfully',
      redirectUrl: '/billing?success=true',
    });
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to capture order', message: error.message },
      { status: 500 }
    );
  }
}
