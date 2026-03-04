import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

let adminApp = getApps()[0];
if (!adminApp) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      const credential = {
        projectId,
        clientEmail,
        privateKey,
      };

      adminApp = initializeApp({
        credential: cert(credential as any),
      });
      console.log('✅ Firebase Admin SDK initialized for console execute');
    }
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const projectId = request.headers.get('x-project-id');
    const body = await request.json();
    const { command } = body;

    if (!userId || !projectId || !command) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Récupérer les infos du projet
    const db = getFirestore(adminApp);
    const projectRef = db.doc(`users/${userId}/sites/${projectId}`);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();
    const projectName = projectData?.siteName || projectData?.name || 'Mon Projet';
    let domain = projectData?.domain || '';

    // Si domain est vide, essayer de l'extraire de siteName
    if (!domain) {
      domain = projectName;
    }

    // Normaliser le domaine
    const normalizedDomain = domain.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;

    console.log(`🔨 Exécution commande: ${command}`);
    console.log(`   Projet: ${projectName}`);
    console.log(`   Chemin: ${projectPath}`);

    // Exécuter la commande via SSH
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    // Vérifier que le répertoire existe
    const checkDir = await ssh.execCommand(`test -d ${projectPath} && echo 'EXISTS' || echo 'NOT_FOUND'`);
    
    if (checkDir.stdout.includes('NOT_FOUND')) {
      console.warn(`❌ Répertoire n'existe pas: ${projectPath}`);
      ssh.dispose();
      return NextResponse.json(
        { error: `Le répertoire du projet n'existe pas: ${projectPath}` },
        { status: 404 }
      );
    }

    // Exécuter la commande dans le répertoire du projet
    const commandResult = await ssh.execCommand(`cd ${projectPath} && ${command}`, {
      onChannel: 'stdout',
      onData: (chunk: any) => {
        console.log(chunk);
      }
    });

    console.log(`✅ Commande exécutée: ${command}`);
    console.log(`   Code de sortie: ${commandResult.code}`);
    console.log(`   Sortie: ${commandResult.stdout.substring(0, 500)}`);

    ssh.dispose();

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      command,
      output: commandResult.stdout,
      error: commandResult.stderr,
      exitCode: commandResult.code
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'exécution:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'exécution de la commande' },
      { status: 500 }
    );
  }
}
