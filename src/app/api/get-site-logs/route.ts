import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

/**
 * API pour récupérer les logs réels d'un site depuis le VPS
 * Lit les logs nginx et les logs de l'application
 */

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
    console.error('Firebase Admin init error:', error);
  }
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    if (adminApp) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken.uid;
    }

    // Fallback REST API
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) return null;

    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.users?.[0]?.localId || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

async function getSiteLogsFromVPS(userId: string, siteName: string, lines: number = 100): Promise<any[]> {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    const logs: any[] = [];
    const logsDir = `/var/www/users/${userId}/sites/${siteName}`;
    
    // Récupérer les logs nginx pour ce site
    const nginxAccessLog = `/var/log/nginx/${siteName}_access.log`;
    const nginxErrorLog = `/var/log/nginx/${siteName}_error.log`;

    // Essayer de lire les logs nginx (s'ils existent)
    try {
      const accessLogResult = await ssh.execCommand(`tail -n ${lines} ${nginxAccessLog} 2>/dev/null || echo ""`);
      if (accessLogResult.stdout && accessLogResult.stdout.trim()) {
        const accessLines = accessLogResult.stdout.split('\n').filter((l: string) => l.trim());
        accessLines.forEach((line: string) => {
          logs.push({
            id: `nginx-access-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level: 'info',
            message: line,
            source: 'nginx-access',
          });
        });
      }
    } catch (error) {
      console.log(`No access logs for ${siteName}`);
    }

    try {
      const errorLogResult = await ssh.execCommand(`tail -n ${lines} ${nginxErrorLog} 2>/dev/null || echo ""`);
      if (errorLogResult.stdout && errorLogResult.stdout.trim()) {
        const errorLines = errorLogResult.stdout.split('\n').filter((l: string) => l.trim());
        errorLines.forEach((line: string) => {
          logs.push({
            id: `nginx-error-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level: line.toLowerCase().includes('error') ? 'error' : 'warning',
            message: line,
            source: 'nginx-error',
          });
        });
      }
    } catch (error) {
      console.log(`No error logs for ${siteName}`);
    }

    // Lire les logs applicatifs (s'ils existent)
    try {
      const appLogResult = await ssh.execCommand(`tail -n ${lines} ${logsDir}/logs.txt 2>/dev/null || echo ""`);
      if (appLogResult.stdout && appLogResult.stdout.trim()) {
        const appLines = appLogResult.stdout.split('\n').filter((l: string) => l.trim());
        appLines.forEach((line: string) => {
          logs.push({
            id: `app-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level: line.toLowerCase().includes('error') ? 'error' : 
                   line.toLowerCase().includes('warning') ? 'warning' : 'info',
            message: line,
            source: 'app',
          });
        });
      }
    } catch (error) {
      console.log(`No app logs for ${siteName}`);
    }

    // Trier par timestamp (plus récent d'abord)
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    ssh.dispose();
    return logs;
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { siteName, lines = 100 } = body;

    if (!siteName) {
      return NextResponse.json({ error: 'siteName requis' }, { status: 400 });
    }

    // Récupérer les logs réels du VPS
    const logs = await getSiteLogsFromVPS(userId, siteName, lines);

    return NextResponse.json({
      success: true,
      logs,
      siteName,
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des logs',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
