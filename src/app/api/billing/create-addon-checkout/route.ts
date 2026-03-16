import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

/**
 * POST /api/billing/create-addon-checkout
 * Crée une session de checkout Stripe pour un add-on
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const { addOnId, returnUrl } = await request.json();

    if (!userId || !addOnId) {
      return NextResponse.json(
        { message: 'Missing userId or addOnId' },
        { status: 400 }
      );
    }

    const { firestore: db } = initializeFirebase();

    // Récupérer l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Créer une session Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { message: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const stripe = require('stripe')(stripeKey);

    // Déterminer le prix Stripe basé sur l'add-on
    let priceId: string;
    let productName: string;

    if (addOnId === 'collaborators') {
      // À obtenir de Stripe Dashboard
      priceId = process.env.STRIPE_PRICE_COLLABORATORS_MONTHLY || 'price_collaborators_monthly';
      productName = 'Team Collaborators - Monthly';
    } else {
      return NextResponse.json(
        { message: 'Unknown add-on' },
        { status: 400 }
      );
    }

    // Créer ou récupérer le customer Stripe
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      // Créer un nouveau customer
      const customer = await stripe.customers.create({
        email: userData.email || `user_${userId}@saasflow.app`,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // Stocker le customerId dans Firestore
      await updateDoc(userRef, {
        stripeCustomerId: customerId,
      });
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?addon_activated=true`,
      cancel_url: returnUrl,
      metadata: {
        userId: userId,
        addOnId: addOnId,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
