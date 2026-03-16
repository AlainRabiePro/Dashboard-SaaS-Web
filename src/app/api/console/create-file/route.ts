import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import path from 'path';

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

interface CreateFileRequest {
  filePath: string;
  content: string;
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const projectId = request.headers.get('x-project-id');

  if (!userId || !projectId) {
    return NextResponse.json(
      { error: 'Paramètres manquants' },
      { status: 400 }
    );
  }

  try {
    const { filePath, content } = (await request.json()) as CreateFileRequest;

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'Chemin du fichier et contenu requis' },
        { status: 400 }
      );
    }

    // Récupérer les infos du projet
    const projectRef = doc(db, 'users', userId, 'sites', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      );
    }

    const projectData = projectSnap.data();
    
    // Utiliser le domaine réel si disponible
    let domain = projectData?.domain || '';
    
    if (!domain) {
      domain = projectData?.siteName || projectData?.name || projectId;
    }
    
    // Normaliser le domaine
    const normalizedDomain = domain.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;
    const fullPath = `${projectPath}/${filePath}`;

    // ✅ Créer le fichier via SSH
    const created = await createFileViaSSH(fullPath, content);
    
    if (!created) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du fichier' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      name: path.basename(filePath),
      path: filePath,
      message: 'Fichier créé avec succès'
    });
  } catch (error) {
    console.error('❌ Error creating file:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du fichier', details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ Create file on VPS
const createFileViaSSH = async (filePath: string, content: string): Promise<boolean> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    // Créer le répertoire parent s'il n'existe pas
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    const mkdirCmd = `mkdir -p "${dirPath}"`;
    await ssh.execCommand(mkdirCmd);

    // Écrire le contenu dans le fichier
    // Échapper les caractères spéciaux pour la sécurité
    const escapedContent = content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    
    const writeCmd = `echo -e "${escapedContent}" > "${filePath}"`;
    const result = await ssh.execCommand(writeCmd);
    
    ssh.dispose();

    if (result.code === 0) {
      console.log(`✅ Fichier créé: ${filePath}`);
      return true;
    }
    
    console.error(`❌ Erreur création fichier: ${result.stderr}`);
    return false;
  } catch (error: any) {
    console.error('❌ SSH Error:', error.message);
    return false;
  }
};
