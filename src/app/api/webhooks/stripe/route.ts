import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/stripe
 * Webhook Stripe pour gérer les événements de souscription
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const { firestore: db } = initializeFirebase();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Activer l'add-on quand la souscription est créée/mise à jour
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const addOnId = subscription.metadata?.addOnId;

        if (userId && addOnId) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            'subscription.activeAddOns': [addOnId], // Ajouter aux add-ons actifs
            'subscription.updatedAt': Timestamp.now(),
          });
          console.log(`✅ Add-on ${addOnId} activated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Désactiver l'add-on quand la souscription est annulée
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        const addOnId = subscription.metadata?.addOnId;

        if (userId && addOnId) {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          const activeAddOns = userData?.subscription?.activeAddOns || [];
          const updatedAddOns = activeAddOns.filter((id: string) => id !== addOnId);

          await updateDoc(userRef, {
            'subscription.activeAddOns': updatedAddOns,
            'subscription.updatedAt': Timestamp.now(),
          });
          console.log(`❌ Add-on ${addOnId} deactivated for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;
      }

      case 'invoice.payment_failed': {
        console.log('❌ Payment failed:', event.data.object.id);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
