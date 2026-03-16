import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
    const packageJsonPath = `${projectPath}/package.json`;

    // ✅ Mettre à jour le package.json via SSH
    const result = await updatePackageJsonScripts(packageJsonPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scripts de test ajoutés avec succès',
      scripts: result.scripts
    });
  } catch (error) {
    console.error('❌ Error updating package.json:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du package.json', details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ Update package.json scripts via SSH
const updatePackageJsonScripts = async (packageJsonPath: string): Promise<{ success: boolean; error?: string; scripts?: Record<string, string> }> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    // Lire le contenu du package.json
    const readCmd = `cat "${packageJsonPath}"`;
    const readResult = await ssh.execCommand(readCmd);
    
    if (readResult.code !== 0) {
      ssh.dispose();
      return { success: false, error: 'Impossible de lire package.json' };
    }

    let packageJson = JSON.parse(readResult.stdout);

    // Ajouter les scripts de test
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.test = 'jest';
    packageJson.scripts['test:watch'] = 'jest --watch';
    packageJson.scripts['test:coverage'] = 'jest --coverage';

    // Écrire le fichier mis à jour
    const updatedContent = JSON.stringify(packageJson, null, 2);
    
    // Échapper le contenu pour la sécurité
    const escapedContent = updatedContent
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\$/g, '\\$');
    
    const writeCmd = `echo -e "${escapedContent}" > "${packageJsonPath}"`;
    const writeResult = await ssh.execCommand(writeCmd);
    
    ssh.dispose();

    if (writeResult.code === 0) {
      console.log(`✅ package.json mis à jour: ${packageJsonPath}`);
      return { 
        success: true, 
        scripts: packageJson.scripts 
      };
    }
    
    console.error(`❌ Erreur écriture: ${writeResult.stderr}`);
    return { success: false, error: 'Erreur lors de l\'écriture' };
  } catch (error: any) {
    console.error('❌ SSH Error:', error.message);
    return { success: false, error: error.message };
  }
};
