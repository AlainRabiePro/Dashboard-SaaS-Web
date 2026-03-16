import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, Timestamp, collection, setDoc } from 'firebase/firestore';

/**
 * POST /api/webhooks/paypal
 * Webhook pour les événements PayPal
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    const { firestore: db } = initializeFirebase();

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // Commande approuvée
        console.log('✅ PayPal order approved:', event.resource.id);
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Paiement capturé avec succès
        const capture = event.resource;
        console.log('✅ Payment captured:', capture.id);

        // Récupérer l'ID utilisateur depuis la commande parent
        // Vous devez implémenter la logique pour associer userId
        break;
      }

      case 'BILLING.SUBSCRIPTION.CREATED': {
        // Souscription créée (si vous utilisez les souscriptions PayPal)
        const subscription = event.resource;
        console.log('✅ Subscription created:', subscription.id);
        break;
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        // Souscription mise à jour
        const subscription = event.resource;
        console.log('📝 Subscription updated:', subscription.id);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        // Souscription annulée
        const subscription = event.resource;
        console.log('❌ Subscription cancelled:', subscription.id);
        break;
      }

      default:
        console.log('⚠️ Unhandled event type:', event.event_type);
    }

    // Retourner 200 pour confirmer au webhook
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}
