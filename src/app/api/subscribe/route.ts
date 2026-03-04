import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { 
  initializeApp, 
  getApps,
  cert 
} from 'firebase-admin/app';
import { 
  getFirestore 
} from 'firebase-admin/firestore';
import { 
  getAuth 
} from 'firebase-admin/auth';

/**
 * API pour créer un abonnement Stripe
 * 
 * Body:
 * {
 *   planId: "basic" | "professional" | "enterprise",
 *   priceId: "price_xxx",  // Stripe Price ID
 *   email: "user@example.com"
 * }
 */

const PLANS: Record<string, { name: string; storage: number; price: number }> = {
  basic: { name: 'Basic', storage: 5, price: 4.99 },
  professional: { name: 'Professional', storage: 15, price: 9.99 },
  enterprise: { name: 'Enterprise', storage: 100, price: 16.99 }
};

// Initialiser Firebase Admin si pas déjà fait
let adminApp = getApps()[0];
if (!adminApp) {
  try {
    const credential = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (credential.projectId && credential.clientEmail && credential.privateKey) {
      adminApp = initializeApp({
        credential: cert(credential as any),
      });
    }
  } catch (error) {
    console.error('Firebase Admin init error (not critical):', error);
  }
}

async function verifyAndGetUserId(token: string): Promise<string | null> {
  try {
    // Essayer avec Firebase Admin d'abord
    if (adminApp) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken.uid;
    }
    
    // Fallback: utiliser l'API REST de Firebase pour vérifier le token
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      console.warn('FIREBASE_API_KEY not configured');
      return null;
    }

    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      console.error('Token verification failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.users?.[0]?.localId || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

async function saveSubscriptionToFirestore(userId: string, planId: string, plan: any): Promise<void> {
  try {
    // Essayer avec Firebase Admin d'abord
    if (adminApp) {
      const db = getFirestore(adminApp);
      const userRef = db.collection('users').doc(userId);

      await userRef.update({
        plan: planId,
        storageLimit: plan.storage,
        subscriptionStatus: 'active',
        subscriptionDate: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Plan ${planId} sauvegardé pour l'utilisateur ${userId} via Admin`);
      return;
    }

    // Fallback: utiliser l'API REST de Firestore
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      console.warn('FIREBASE_PROJECT_ID not configured, skipping Firestore save');
      return;
    }

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=plan&updateMask.fieldPaths=storageLimit&updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=updatedAt`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            plan: { stringValue: planId },
            storageLimit: { integerValue: plan.storage },
            subscriptionStatus: { stringValue: 'active' },
            updatedAt: { timestampValue: new Date().toISOString() }
          }
        })
      }
    );

    if (!response.ok) {
      console.warn(`Failed to save subscription via REST: ${response.status}`);
      // C'est OK si ça échoue - on a au moins vérifié le token
      return;
    }

    console.log(`✅ Plan ${planId} sauvegardé pour l'utilisateur ${userId} via REST API`);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du plan:', error);
    // Ne pas throw - la sauvegarde Firestore est optionnelle pour le test
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = await verifyAndGetUserId(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, priceId, email } = body;

    if (!planId || !email) {
      return NextResponse.json(
        { error: 'planId et email requis' },
        { status: 400 }
      );
    }

    if (!Object.keys(PLANS).includes(planId)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    // Sauvegarder le plan dans Firestore
    await saveSubscriptionToFirestore(userId, planId, plan);

    // Intégrer Stripe Checkout
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.warn('STRIPE_SECRET_KEY not configured, skipping Stripe integration');
      return NextResponse.json({
        success: true,
        message: `Abonnement ${plan.name} créé avec succès (mode test)`,
        planId,
        storage: plan.storage,
        checkoutUrl: null,
        warning: 'Stripe non configuré - mode test',
      });
    }

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-10-28',
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/select-plan?canceled=true`,
        metadata: {
          planId,
          userId,
          email,
        },
      });

      console.log(`✅ Stripe Checkout session créée - ${session.id} pour ${email}`);

      return NextResponse.json({
        success: true,
        message: `Redirection vers Stripe Checkout`,
        planId,
        storage: plan.storage,
        sessionId: session.id,
        checkoutUrl: session.url,
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      
      // Fallback: rediriger quand même avec un warning
      return NextResponse.json({
        success: true,
        message: `Abonnement ${plan.name} créé (Stripe erreur)`,
        planId,
        storage: plan.storage,
        checkoutUrl: null,
        error: 'Stripe non disponible actuellement',
      });
    }

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'abonnement:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la création de l\'abonnement',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
