import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { promises as fs } from 'fs';
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

interface FileContent {
  name: string;
  content?: string | null;
  language: string;
  path: string;
  size?: string;
}

// Détermine le langage en fonction de l'extension
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

// Récursivement lire les fichiers du projet (non utilisé mais conservé pour compatibilité)
// const readProjectFiles = async (projectPath: string, basePath: string = '', maxFiles: number = 50): Promise<FileContent[]> => { ... }

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const projectId = request.headers.get('x-project-id');

  if (!userId || !projectId) {
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
    const projectName = projectData?.siteName || projectData?.name || 'Mon Projet';
    let domain = projectData?.domain || '';
    
    // Si domain est vide, essayer de l'extraire de siteName/name
    if (!domain) {
      if (projectName && projectName.includes('.')) {
        domain = projectName;
      } else {
        domain = projectName;
      }
    }
    
    // Normaliser le domaine
    const normalizedDomain = domain.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;

    console.log(`📂 Loading file list from: ${projectPath}`);
    
    // ✅ OPTIMIZED: Only load file list first (not content!)
    const files = await getFileListViaSSH(projectPath);
    
    if (files.length === 0) {
      return NextResponse.json({
        files: [
          {
            name: 'README.md',
            path: 'README.md',
            language: 'markdown',
            content: `# ${projectName}\n\nLe projet n'a pas été trouvé ou est vide.`,
            size: '0'
          }
        ],
        total: 1,
        project: { id: projectId, name: projectName, domain },
        source: 'error'
      });
    }

    console.log(`✅ Found ${files.length} files`);

    return NextResponse.json({
      files,
      total: files.length,
      project: { id: projectId, name: projectName, domain },
      source: 'filesystem'
    });
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des fichiers', details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ FAST: Get only file list (NO content loading!)
const getFileListViaSSH = async (projectPath: string, maxFiles: number = 500): Promise<any[]> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    // Only get file names and sizes - NOT full content!
    const findCmd = `find "${projectPath}" -type f \\( -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' -not -path '*/dist/*' -not -path '*/build/*' \\) 2>/dev/null | head -${maxFiles}`;
    const findResult = await ssh.execCommand(findCmd);
    
    if (findResult.code !== 0) {
      console.warn('⚠️  Find command failed:', findResult.stderr);
      ssh.dispose();
      return [];
    }

    const filePaths = findResult.stdout.split('\n').filter(Boolean);
    
    const fileList = filePaths.map(filePath => ({
      name: path.basename(filePath),
      path: filePath.replace(projectPath + '/', ''),
      language: getLanguageFromExtension(filePath),
      size: '?',  // Size will be loaded on demand
      content: null  // ⚠️ Content NOT loaded! Fast!
    }));

    ssh.dispose();
    return fileList;
  } catch (error: any) {
    console.error('❌ SSH Error:', error.message);
    return [];
  }
}
