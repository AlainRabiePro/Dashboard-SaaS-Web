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

// Get language from file extension
const getLanguageFromExtension = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.env': 'properties',
    '.sql': 'sql',
    '.sh': 'bash',
    '.py': 'python',
  };
  return languageMap[ext] || 'text';
};

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const projectId = request.headers.get('x-project-id');
  const filePath = request.nextUrl.searchParams.get('filePath');

  if (!userId || !projectId || !filePath) {
    return NextResponse.json(
      { error: 'Paramètres manquants' },
      { status: 400 }
    );
  }

  try {
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
    let domain = projectData?.domain || '';
    
    if (!domain) {
      const projectName = projectData?.siteName || projectData?.name || '';
      domain = projectName.includes('.') ? projectName : projectName;
    }
    
    // Normaliser le domaine
    const normalizedDomain = domain.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;
    const fullPath = `${projectPath}/${filePath}`;

    // ✅ Charger le contenu du fichier via SSH (uniquement si demandé!)
    const content = await getFileContentViaSSH(fullPath);
    
    if (content === null) {
      return NextResponse.json(
        { error: 'Fichier non trouvé ou non lisible' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: path.basename(filePath),
      path: filePath,
      language: getLanguageFromExtension(filePath),
      content: content,
      size: content.length
    });
  } catch (error) {
    console.error('❌ Error fetching file content:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du fichier', details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ Get file content from VPS
const getFileContentViaSSH = async (filePath: string): Promise<string | null> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    const readCmd = `cat "${filePath}"`;
    const readResult = await ssh.execCommand(readCmd);
    
    ssh.dispose();

    if (readResult.code === 0) {
      const content = readResult.stdout;
      
      // Limiter la taille du contenu (max 1MB par fichier)
      if (content.length <= 1048576) {
        return content;
      } else {
        console.warn(`⚠️  Fichier trop volumineux: ${filePath} (${content.length} bytes)`);
        return null;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ SSH Error:', error.message);
    return null;
  }
};
