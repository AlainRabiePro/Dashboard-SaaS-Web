import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * API pour créer une session de paiement Stripe pour un domaine
 * 
 * Body:
 * {
 *   orderId: "xxx",
 *   domain: "amazon.app",
 *   price: 11.99
 * }
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, domain, price } = body;

    if (!orderId || !domain || !price) {
      return NextResponse.json(
        { error: 'orderId, domain et price sont requis' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe non configuré' },
        { status: 500 }
      );
    }

    // Créer une session de paiement unique
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Mode paiement unique (pas abonnement)
      customer_email: request.headers.get('x-user-email') || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Domaine ${domain}`,
              description: `Enregistrement du domaine ${domain} pour 1 an`,
              images: [],
            },
            unit_amount: Math.round(price * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/domains?order_id=${orderId}&payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/domains?order_id=${orderId}&payment=canceled`,
      metadata: {
        orderId,
        userId,
        domain,
        type: 'domain_purchase',
      },
    });

    console.log(`✅ Session Stripe créée pour le domaine ${domain} - ${session.id}`);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      orderId,
      domain,
      price,
    });
  } catch (error: any) {
    console.error('Erreur Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
