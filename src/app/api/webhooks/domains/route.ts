import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { registerDomain } from '@/lib/domain-registrar';

/**
 * Webhook Stripe pour les événements de paiement de domaines
 * 
 * À configurer dans Stripe Dashboard:
 * 1. Aller dans Developers > Webhooks
 * 2. Add endpoint: https://yoursite.com/api/webhooks/domains
 * 3. Sélectionner les événements: checkout.session.completed
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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ STRIPE_WEBHOOK_SECRET non configuré');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('❌ Erreur de signature webhook:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.type === 'domain_purchase') {
          const orderId = session.metadata.orderId;
          const userId = session.metadata.userId;
          const domain = session.metadata.domain;

          console.log(`✅ Paiement reçu pour domaine ${domain} (${session.id})`);

          // Mettre à jour la commande avec l'ID de session Stripe
          const orderRef = doc(db, 'domain_orders', orderId);
          
          // Enregistrer le domaine auprès du registrar
          const registerResult = await registerDomain(
            domain,
            userId,
            session.customer_email || 'noemail@example.com'
          );

          if (registerResult.success) {
            await updateDoc(orderRef, {
              status: 'paid',
              stripeSessionId: session.id,
              paymentId: session.payment_intent,
              registrarOrderId: registerResult.registrarOrderId,
              registrarName: registerResult.registrarName,
              registeredAt: new Date(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
              updatedAt: new Date(),
            });

            console.log(`✅ Domaine ${domain} enregistré avec succès via ${registerResult.registrarName}`);
          } else {
            // Paiement reçu mais enregistrement échoué - marquer en attente d'enregistrement
            await updateDoc(orderRef, {
              status: 'paid',
              stripeSessionId: session.id,
              paymentId: session.payment_intent,
              registrationStatus: 'pending',
              registrationError: registerResult.error,
              updatedAt: new Date(),
            });

            console.error(`⚠️ Domaine ${domain} payé mais enregistrement échoué:`, registerResult.error);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata?.type === 'domain_purchase') {
          const orderId = paymentIntent.metadata.orderId;
          const domain = paymentIntent.metadata.domain;

          console.error(`❌ Paiement échoué pour domaine ${domain}`);

          const orderRef = doc(db, 'domain_orders', orderId);
          await updateDoc(orderRef, {
            status: 'failed',
            paymentError: paymentIntent.last_payment_error?.message,
            updatedAt: new Date(),
          });
        }
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Erreur traitement webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}
