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
    let domain = projectData?.name || projectData?.siteName || projectData?.domain || projectId;
    
    // Normaliser le domaine
    const normalizedDomain = domain.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;

    // ✅ Exécuter npm install via SSH
    const result = await runNpmInstall(projectPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'installation', output: result.output },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dépendances installées avec succès',
      output: result.output
    });
  } catch (error) {
    console.error('❌ Error installing dependencies:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'installation des dépendances', details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ Run npm install on VPS
const runNpmInstall = async (projectPath: string): Promise<{ success: boolean; error?: string; output?: string }> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    console.log(`[NPM-INSTALL] Starting npm install in ${projectPath}...`);

    // Vérifier d'abord le package.json pour Jest
    const checkCmd = `cat "${projectPath}/package.json" | grep -i jest || echo "jest-not-found"`;
    const checkResult = await ssh.execCommand(checkCmd);
    const hasJest = !checkResult.stdout.includes('jest-not-found') && checkResult.stdout.includes('jest');
    
    console.log(`[NPM-INSTALL] Jest in dependencies: ${hasJest}`);
    
    if (!hasJest) {
      console.log(`[NPM-INSTALL] Jest not found, adding it...`);
      // Installer Jest
      const jestCmd = `cd "${projectPath}" && npm install --save-dev jest @types/jest 2>&1`;
      const jestResult = await ssh.execCommand(jestCmd);
      console.log(`[NPM-INSTALL] Jest installation: ${jestResult.stdout.substring(0, 500)}`);
    }

    // Exécuter npm install
    const installCmd = `cd "${projectPath}" && npm install 2>&1`;
    const result = await ssh.execCommand(installCmd);
    
    ssh.dispose();

    const output = result.stdout || result.stderr || '';
    
    if (result.code === 0) {
      console.log(`✅ npm install completed successfully`);
      
      // Vérifier que Jest est maintenant installé
      const verifyCmd = `cd "${projectPath}" && npm list jest 2>&1 | head -5`;
      const verifyResult = await ssh.execCommand(verifyCmd);
      console.log(`[NPM-INSTALL] Jest verification:\n${verifyResult.stdout}`);
      
      return { 
        success: true, 
        output: output.substring(0, 2000) + '\n\n✅ Jest devrait être installé et prêt à être utilisé.'
      };
    }
    
    console.error(`❌ npm install failed with exit code ${result.code}`);
    console.error(`Output:\n${output.substring(0, 1000)}`);
    return { 
      success: false, 
      error: 'npm install a échoué. Vérifiez le package.json.',
      output: output.substring(0, 2000)
    };
  } catch (error: any) {
    console.error('❌ SSH Error:', error.message);
    return { success: false, error: error.message };
  }
};
