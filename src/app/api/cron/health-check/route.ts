import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { performHealthCheck, calculateMetrics } from '@/lib/health-check-service';

// This route is only accessible via Vercel Cron
// Configure in vercel.json with:
// {
//   "crons": [{
//     "path": "/api/cron/health-check",
//     "schedule": "*/5 * * * *"  // Every 5 minutes
//   }]
// }

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

export async function GET(request: NextRequest) {
  // Verify it's a Vercel Cron request
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Récupérer tous les utilisateurs et leurs sites
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);

    let totalChecked = 0;
    let successfulChecks = 0;

    // Pour chaque utilisateur
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;

      // Récupérer les sites de cet utilisateur
      const sitesRef = collection(db, 'users', userId, 'sites');
      const sitesSnap = await getDocs(sitesRef);

      // Pour chaque site
      for (const siteDoc of sitesSnap.docs) {
        const siteData = siteDoc.data();
        const domain = siteData.domain || siteData.deploymentUrl;

        if (!domain) continue;

        totalChecked++;

        try {
          // Effectuer le health check
          const healthResult = await performHealthCheck(domain);

          // Sauvegarder le résultat
          const metricsRef = collection(
            db,
            'users',
            userId,
            'sites',
            siteDoc.id,
            'healthChecks'
          );

          // Ajouter le nouveau check
          await setDoc(doc(metricsRef), {
            domain,
            status: healthResult.status,
            latency: healthResult.latency,
            healthy: healthResult.healthy,
            timestamp: healthResult.timestamp,
          });

          // Calculer les métriques
          const allChecks = await getDocs(metricsRef);
          const recentChecks = allChecks.docs
            .map(d => d.data())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 100);

          if (recentChecks.length > 0) {
            const metrics = calculateMetrics(
              recentChecks.map(c => ({
                domain: c.domain,
                status: c.status,
                latency: c.latency,
                timestamp: c.timestamp,
                healthy: c.healthy,
              }))
            );

            // Sauvegarder les métriques calculées
            const siteRef = doc(db, 'users', userId, 'sites', siteDoc.id);
            await setDoc(
              siteRef,
              {
                metrics: {
                  uptime: metrics.uptime,
                  latency: metrics.latency,
                  errorRate: metrics.errorRate,
                  lastCheck: metrics.lastCheck,
                  status: metrics.uptime >= 99 ? 'healthy' : metrics.uptime >= 90 ? 'warning' : 'critical',
                },
              },
              { merge: true }
            );
          }

          successfulChecks++;
        } catch (error) {
          console.error(`Error checking health for ${domain}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalChecked,
      successful: successfulChecks,
      message: `Health checks completed: ${successfulChecks}/${totalChecked} sites checked`,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
