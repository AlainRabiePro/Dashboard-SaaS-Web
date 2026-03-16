import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * API pour initialiser l'espace utilisateur sur le VPS
 * Crée la structure: /var/www/users/{userId}/
 *   ├── sites/
 *   ├── data/
 *   └── logs/
 */

async function initializeUserSpaceOnVPS(userId: string): Promise<boolean> {
  const NodeSSH = require('node-ssh').NodeSSH;
  const ssh = new NodeSSH();

  try {
    const sshHost = process.env.DEPLOY_SSH_HOST;
    const sshUser = process.env.DEPLOY_SSH_USER;
    const sshPassword = process.env.DEPLOY_SSH_PASSWORD;
    let sshPrivateKey = process.env.DEPLOY_SSH_PRIVATE_KEY;

    if (!sshHost || !sshUser) {
      throw new Error('Configuration SSH manquante');
    }

    if (sshPrivateKey && !sshPrivateKey.startsWith('-----BEGIN')) {
      try {
        sshPrivateKey = Buffer.from(sshPrivateKey, 'base64').toString('utf-8');
      } catch (e) {
        console.error('Erreur de décodage de la clé privée');
      }
    }

    await ssh.connect({
      host: sshHost,
      username: sshUser,
      password: sshPassword,
      privateKey: sshPrivateKey,
      readyTimeout: 30000,
    });

    const userPath = `/var/www/users/${userId}`;

    // Créer la structure de répertoires
    const commands = [
      `mkdir -p ${userPath}/sites`,
      `mkdir -p ${userPath}/data`,
      `mkdir -p ${userPath}/logs`,
      // Créer un fichier d'index pour éviter les directory listing
      `echo "<?php header('HTTP/1.1 403 Forbidden'); exit; ?>" > ${userPath}/index.php`,
      // Créer un fichier de bienvenue
      `echo "User space for ${userId}" > ${userPath}/README.txt`,
      // Définir les permissions appropriées
      `chmod -R 755 ${userPath}`,
      `chmod 700 ${userPath}/data`,
      `chmod 700 ${userPath}/logs`,
    ];

    for (const command of commands) {
      const result = await ssh.execCommand(command);
      if (result.code !== 0) {
        console.error(`Command failed: ${command}`, result.stderr);
        throw new Error(`Failed to execute: ${command}`);
      }
    }

    console.log(`✅ User space initialized for ${userId} at ${userPath}`);
    return true;

  } catch (error: any) {
    console.error(`❌ Error initializing user space for ${userId}:`, error);
    throw error;
  } finally {
    ssh.dispose();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification Bearer
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'userId du body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId manquant' },
        { status: 400 }
      );
    }

    // Valider que l'userId est un format valide (alphanumèrique)
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json(
        { error: 'userId invalide' },
        { status: 400 }
      );
    }

    // Initialiser le document utilisateur dans Firestore avec plan free
    const { firestore: db } = initializeFirebase();
    const userRef = doc(db, 'users', userId);
    
    try {
      await setDoc(userRef, {
        subscription: {
          plan: 'free',
          createdAt: Timestamp.now(),
        },
        createdAt: Timestamp.now(),
      }, { merge: true }); // merge pour ne pas overwrite d'autres données
      console.log(`✅ User subscription initialized in Firestore for ${userId}`);
    } catch (dbError) {
      console.error(`⚠️ Warning: Failed to initialize user in Firestore:`, dbError);
      // Ne pas bloquer si Firestore échoue, le VPS init est prioritaire
    }

    // Initialiser l'espace utilisateur
    await initializeUserSpaceOnVPS(userId);

    return NextResponse.json({
      success: true,
      message: `Espace utilisateur créé pour ${userId}`,
      userPath: `/var/www/users/${userId}`,
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de l\'initialisation de l\'espace utilisateur',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
