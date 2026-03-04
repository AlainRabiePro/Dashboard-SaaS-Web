import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

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
 * GET - Récupère les alertes actives
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get('siteId');

    let alertsRef: any;

    if (siteId) {
      // Alertes pour un site spécifique
      alertsRef = collection(db, 'users', userId, 'sites', siteId, 'alerts');
    } else {
      // Alertes pour tous les sites
      // On les récupère en itérant sur tous les sites
      const sitesRef = collection(db, 'users', userId, 'sites');
      const sitesSnap = await getDocs(sitesRef);

      let allAlerts: any[] = [];

      for (const siteDoc of sitesSnap.docs) {
        const siteAlertsRef = collection(
          db,
          'users',
          userId,
          'sites',
          siteDoc.id,
          'alerts'
        );
        const alertsSnap = await getDocs(siteAlertsRef);
        alertsSnap.docs.forEach(doc => {
          const data = doc.data() as any;
          allAlerts.push({
            documentId: doc.id,
            siteId: siteDoc.id,
            rule: data.rule,
            severity: data.severity,
            message: data.message,
            timestamp: data.timestamp,
            resolved: data.resolved,
            createdAt: data.createdAt,
          });
        });
      }

      // Tri par timestamp décroissant et filtrer par les alertes non résolues
      allAlerts = allAlerts
        .filter(a => !a.resolved)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);

      return NextResponse.json({
        alerts: allAlerts,
        total: allAlerts.length,
      });
    }

    // Pour un site spécifique
    const alertsSnap = await getDocs(alertsRef);
    const alerts = alertsSnap.docs
      .map(d => {
        const data = d.data() as any;
        return {
          documentId: d.id,
          rule: data.rule,
          severity: data.severity,
          message: data.message,
          timestamp: data.timestamp,
          resolved: data.resolved,
          createdAt: data.createdAt,
        };
      })
      .filter(a => !a.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      siteId,
      alerts,
      total: alerts.length,
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Crée une nouvelle alerte
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId, rule, severity, message } = await request.json();

    if (!siteId || !rule || !severity || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const alertsRef = collection(db, 'users', userId, 'sites', siteId, 'alerts');

    const alert = {
      rule,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    const docRef = doc(alertsRef);
    await setDoc(docRef, alert);

    return NextResponse.json({
      success: true,
      alertId: docRef.id,
      alert,
    });
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH - Marque une alerte comme résolue
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId, alertId } = await request.json();

    if (!siteId || !alertId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const alertRef = doc(db, 'users', userId, 'sites', siteId, 'alerts', alertId);
    await setDoc(
      alertRef,
      {
        resolved: true,
        resolvedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Alert marked as resolved',
    });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
