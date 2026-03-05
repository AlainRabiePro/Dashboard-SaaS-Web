import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createLogger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limiter';

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

const logger = createLogger('domains/checkout');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Rate limiting - max 5 requêtes par minute par utilisateur
    const rateLimitKey = `checkout:${userId}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 }
      );
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
      logger.error('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Stripe non configuré' },
        { status: 500 }
      );
    }

    // Vérifier NEXT_PUBLIC_APP_URL - critiquer pour la prod
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      logger.error('Invalid NEXT_PUBLIC_APP_URL for production', { appUrl });
      throw new Error('NEXT_PUBLIC_APP_URL doit être configuré sans localhost');
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
      success_url: `${appUrl}/domains?order_id=${orderId}&payment=success`,
      cancel_url: `${appUrl}/domains?order_id=${orderId}&payment=canceled`,
      metadata: {
        orderId,
        userId,
        domain,
        type: 'domain_purchase',
      },
    });

    logger.info(`Stripe session created for domain ${domain}`, {
      sessionId: session.id,
      price,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      orderId,
      domain,
      price,
    });
  } catch (error: any) {
    logger.error('Checkout error', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
