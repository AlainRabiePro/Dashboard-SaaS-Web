import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import {
  createSubscriptionInvoice,
  generateInvoiceNumber,
  type Invoice,
} from '@/lib/invoice-service';

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

/**
 * GET /api/invoices
 * Récupère les factures de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoicesRef = collection(db, 'users', userId, 'invoices');
    const q = query(invoicesRef, orderBy('issueDate', 'desc'), limit(100));
    const snapshot = await getDocs(q);

    // Si aucune facture, générer des données de test
    if (snapshot.empty) {
      try {
        await seedInvoices(userId, request);
        
        // Refaire la requête après seeding
        const q2 = query(invoicesRef, orderBy('issueDate', 'desc'), limit(100));
        const snapshot2 = await getDocs(q2);
        
        const invoices: Invoice[] = [];
        snapshot2.forEach((doc) => {
          invoices.push({
            id: doc.id,
            ...(doc.data() as Omit<Invoice, 'id'>),
          });
        });

        return NextResponse.json({ invoices, seeded: true });
      } catch (seedError) {
        console.error('Error seeding invoices:', seedError);
        return NextResponse.json(
          { invoices: [], seeded: false },
          { status: 200 }
        );
      }
    }

    const invoices: Invoice[] = [];
    snapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...(doc.data() as Omit<Invoice, 'id'>),
      });
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Crée une nouvelle facture
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userEmail,
      userName,
      planName,
    } = body;

    if (!userEmail || !userName || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, userName, planName' },
        { status: 400 }
      );
    }

    // Obtenir le nombre de factures existantes pour générer le numéro
    const invoicesRef = collection(db, 'users', userId, 'invoices');
    const allInvoices = await getDocs(invoicesRef);
    const invoiceCount = allInvoices.size;

    // Créer la facture
    const invoiceData = createSubscriptionInvoice(
      userId,
      userEmail,
      userName,
      planName,
      invoiceCount
    );

    // Sauvegarder en Firestore
    const docRef = await addDoc(invoicesRef, invoiceData);

    // 🎯 Enregistrer l'action dans l'audit log
    try {
      const auditRef = collection(db, 'users', userId, 'audit_logs');
      await addDoc(auditRef, {
        action: 'INVOICE_CREATE',
        title: 'Création de facture',
        description: `Facture créée: ${invoiceData.invoiceNumber} (${planName}) - ${invoiceData.total.toFixed(2)}$`,
        timestamp: Date.now(),
        resourceId: docRef.id,
        resourceType: 'invoice',
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('⚠️ Error creating audit log:', auditError);
      // Ne pas bloquer la création de facture
    }

    return NextResponse.json({
      id: docRef.id,
      ...invoiceData,
    } as Invoice);
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

/**
 * Génère des factures de test pour la démo
 */
async function seedInvoices(userId: string, request: NextRequest) {
  try {
    // Récupérer les infos utilisateur depuis Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    const userData = userDoc?.data() as any || {};
    const userEmail = userData.email || 'user@example.com';
    const userName = userData.displayName || userData.name || 'User';

    const invoicesRef = collection(db, 'users', userId, 'invoices');

    // Créer 6 factures pour les 6 derniers mois
    const plans = ['Starter', 'Professional', 'Enterprise'];
    const now = Date.now();

    for (let i = 5; i >= 0; i--) {
      const monthAgo = now - i * 30 * 24 * 60 * 60 * 1000;
      const plan = plans[i % plans.length];
      
      const invoiceData = createSubscriptionInvoice(
        userId,
        userEmail,
        userName,
        plan,
        i
      );

      // Modifier la date d'émission
      invoiceData.issueDate = monthAgo;
      invoiceData.dueDate = monthAgo + 30 * 24 * 60 * 60 * 1000;

      // Marquer les anciennes factures comme payées
      if (i > 0) {
        invoiceData.status = 'paid';
        invoiceData.paidDate = monthAgo + 5 * 24 * 60 * 60 * 1000;
      }

      await addDoc(invoicesRef, invoiceData);
    }

    console.log(`✅ Seeded ${6} invoices for user ${userId}`);
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}
