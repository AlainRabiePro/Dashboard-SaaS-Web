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
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️  Firebase Admin credentials incomplete:', {
        projectId: !!credential.projectId,
        clientEmail: !!credential.clientEmail,
        privateKey: !!credential.privateKey,
      });
    }
  } catch (error) {
    console.error('❌ Firebase Admin init error:', error);
  }
}

async function verifyToken(token: string): Promise<string | null> {
  // Try Firebase Admin SDK first
  if (adminApp) {
    try {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      console.log('✅ Token verified successfully via Firebase Admin. UID:', decodedToken.uid);
      return decodedToken.uid;
    } catch (error: any) {
      console.error('❌ Firebase Admin Token verification error:', {
        code: error.code,
        message: error.message,
      });
      // Fall through to REST API fallback
    }
  } else {
    console.warn('⚠️  Firebase Admin app not initialized, using REST API fallback');
  }

  // Fallback to REST API
  try {
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('❌ FIREBASE_API_KEY not configured');
      return null;
    }

    console.log('⏳ Attempting REST API token verification...');
    const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ REST API lookup failed:', {
        status: response.status,
        error: errorData,
      });
      return null;
    }

    const data = await response.json();
    const uid = data.users?.[0]?.localId;
    if (uid) {
      console.log('✅ Token verified via REST API. UID:', uid);
      return uid;
    } else {
      console.error('❌ No UID found in REST API response');
      return null;
    }
  } catch (restError) {
    console.error('❌ REST API fallback error:', restError);
    return null;
  }
}

async function getSiteLogsFromVPS(userId: string, siteName: string, lines: number = 100): Promise<any[]> {
  try {
    console.log(`📝 Starting log fetch for user: ${userId}, site: ${siteName}`);
    
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    console.log(`🔌 Connecting to SSH host: ${process.env.DEPLOY_SSH_HOST}`);
    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });
    console.log('✅ SSH Connected successfully');

    const logs: any[] = [];
    
    // Récupérer les logs nginx globaux
    const nginxAccessLog = `/var/log/nginx/access.log`;
    const nginxErrorLog = `/var/log/nginx/error.log`;

    // Lire les logs nginx globaux (filtrés par site si possible)
    try {
      console.log(`📂 Attempting to read: ${nginxAccessLog}`);
      const accessLogResult = await ssh.execCommand(`tail -n ${lines} ${nginxAccessLog} 2>/dev/null | grep "${siteName}" || tail -n ${lines} ${nginxAccessLog}`);
      console.log(`📄 Nginx access result:`, {
        stdout: accessLogResult.stdout ? `${accessLogResult.stdout.length} bytes` : 'empty',
        stderr: accessLogResult.stderr || 'none',
        code: accessLogResult.code,
      });
      if (accessLogResult.stdout && accessLogResult.stdout.trim()) {
        const accessLines = accessLogResult.stdout.split('\n').filter((l: string) => l.trim());
        console.log(`✅ Found ${accessLines.length} access log lines`);
        accessLines.forEach((line: string) => {
          logs.push({
            id: `nginx-access-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level: 'info',
            message: line,
            source: 'nginx-access',
          });
        });
      } else {
        console.log('⚠️  No access logs found');
      }
    } catch (error) {
      console.error(`❌ Error reading access logs:`, error);
    }

    try {
      console.log(`📂 Attempting to read: ${nginxErrorLog}`);
      const errorLogResult = await ssh.execCommand(`tail -n ${lines} ${nginxErrorLog} 2>/dev/null`);
      console.log(`📄 Nginx error result:`, {
        stdout: errorLogResult.stdout ? `${errorLogResult.stdout.length} bytes` : 'empty',
        stderr: errorLogResult.stderr || 'none',
        code: errorLogResult.code,
      });
      if (errorLogResult.stdout && errorLogResult.stdout.trim()) {
        const errorLines = errorLogResult.stdout.split('\n').filter((l: string) => l.trim());
        console.log(`✅ Found ${errorLines.length} error log lines`);
        errorLines.forEach((line: string) => {
          logs.push({
            id: `nginx-error-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            level: line.toLowerCase().includes('error') ? 'error' : 'warning',
            message: line,
            source: 'nginx-error',
          });
        });
      } else {
        console.log('⚠️  No error logs found');
      }
    } catch (error) {
      console.error(`❌ Error reading error logs:`, error);
    }

    // Lire les logs utilisateur (s'il existe un répertoire logs/)
    try {
      console.log(`📂 Checking for user logs directory: /var/www/users/${userId}/logs/`);
      const logsDir = `/var/www/users/${userId}/logs`;
      
      // Lister les fichiers dans le répertoire logs
      const listResult = await ssh.execCommand(`ls -1 ${logsDir} 2>/dev/null | head -20`);
      if (listResult.stdout && listResult.stdout.trim()) {
        const logFiles = listResult.stdout.split('\n').filter((f: string) => f.trim());
        console.log(`✅ Found ${logFiles.length} log files in user logs directory`);
        
        // Lire chaque fichier de log
        for (const logFile of logFiles) {
          const filePath = `${logsDir}/${logFile}`;
          const fileResult = await ssh.execCommand(`tail -n 50 "${filePath}" 2>/dev/null`);
          if (fileResult.stdout && fileResult.stdout.trim()) {
            const fileLines = fileResult.stdout.split('\n').filter((l: string) => l.trim());
            fileLines.forEach((line: string) => {
              logs.push({
                id: `user-log-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                level: line.toLowerCase().includes('error') ? 'error' : 
                       line.toLowerCase().includes('warning') ? 'warning' : 'info',
                message: line,
                source: `user-logs/${logFile}`,
              });
            });
          }
        }
      } else {
        console.log('⚠️  No user logs directory or empty');
      }
    } catch (error) {
      console.error(`❌ Error reading user logs:`, error);
    }

    // Trier par timestamp (plus récent d'abord)
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`📊 Total logs collected: ${logs.length}`);
    ssh.dispose();
    return logs;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des logs:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return NextResponse.json({ error: 'Non authentifié - En-tête manquant' }, { status: 401 });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Invalid authorization header format:', authHeader.substring(0, 20));
      return NextResponse.json({ error: 'Non authentifié - Format invalide' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = await verifyToken(token);

    if (!userId) {
      console.error('❌ Token verification failed for token:', token.substring(0, 20) + '...');
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    console.log('✅ Token verified successfully for user:', userId);

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
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération des logs',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
