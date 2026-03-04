import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { performHealthCheck, calculateMetrics, formatMetrics } from '@/lib/health-check-service';
import { DEFAULT_ALERT_RULES, shouldTriggerAlert, createAlert } from '@/lib/alert-service';

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

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer tous les sites de l'utilisateur
    const sitesRef = collection(db, 'users', userId, 'sites');
    const sitesSnap = await getDocs(sitesRef);

    const results = [];
    const healthCheckPromises = [];

    // Effectuer un health check pour chaque site
    for (const siteDoc of sitesSnap.docs) {
      const siteData = siteDoc.data();
      let domain = siteData.domain || siteData.deploymentUrl || siteData.name;

      if (!domain) {
        // Créer un domaine par défaut à partir du siteId
        domain = `${siteDoc.id}.local`;
      }

      // Normaliser le domaine
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = `https://${domain}`;
      }

      // Créer une promesse pour le health check
      const checkPromise = (async () => {
        try {
          const healthResult = await performHealthCheck(domain);

          // Sauvegarder le résultat dans Firestore
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

          return {
            siteId: siteDoc.id,
            name: siteData.name || domain,
            domain,
            healthResult,
          };
        } catch (error) {
          console.error(`Error checking health for ${domain}:`, error);
          return null;
        }
      })();

      healthCheckPromises.push(checkPromise);
    }

    // Attendre tous les health checks
    const healthResults = await Promise.all(healthCheckPromises);
    const validResults = healthResults.filter(r => r !== null);

    // Calculer les métriques agrégées et les sauvegarder par site
    for (const result of validResults) {
      try {
        const metricsRef = collection(
          db,
          'users',
          userId,
          'sites',
          result.siteId,
          'healthChecks'
        );

        const metricsSnap = await getDocs(metricsRef);
        const recentChecks = metricsSnap.docs
          .map(d => d.data())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 100); // Derniers 100 checks

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
          const siteRef = doc(db, 'users', userId, 'sites', result.siteId);
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

          // Vérifier les règles d'alerte et créer des alertes si nécessaire
          const alertsRef = collection(
            db,
            'users',
            userId,
            'sites',
            result.siteId,
            'alerts'
          );

          for (const rule of DEFAULT_ALERT_RULES) {
            let metricValue = 0;
            
            if (rule.metric === 'uptime') {
              metricValue = metrics.uptime;
            } else if (rule.metric === 'latency') {
              metricValue = metrics.latency;
            } else if (rule.metric === 'errorRate') {
              metricValue = metrics.errorRate;
            }

            if (shouldTriggerAlert(rule, metricValue)) {
              // Vérifier s'il existe déjà une alerte non résolue pour cette règle
              const existingAlertsSnap = await getDocs(alertsRef);
              const activeAlert = existingAlertsSnap.docs.find(doc => {
                const data = doc.data();
                return data.rule === rule.id && !data.resolved;
              });

              // Créer une nouvelle alerte seulement s'il n'existe pas déjà
              if (!activeAlert) {
                const newAlert = createAlert(result.siteId, rule, metricValue);
                await setDoc(doc(alertsRef), {
                  rule: newAlert.rule,
                  severity: newAlert.severity,
                  message: newAlert.message,
                  timestamp: newAlert.timestamp,
                  resolved: newAlert.resolved,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }

          results.push({
            siteId: result.siteId,
            domain: result.domain,
            metrics: formatMetrics(metrics),
          });
        }
      } catch (error) {
        console.error(`Error calculating metrics for ${result.domain}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      checked: validResults.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in health check:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET - Retourne le statut des derniers health checks
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    }

    // Récupérer les derniers health checks pour le site
    const metricsRef = collection(
      db,
      'users',
      userId,
      'sites',
      siteId,
      'healthChecks'
    );

    const metricsSnap = await getDocs(metricsRef);
    const checks = metricsSnap.docs
      .map(d => d.data())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);

    return NextResponse.json({
      siteId,
      checks,
      totalChecks: checks.length,
    });
  } catch (error: any) {
    console.error('Error fetching health checks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
