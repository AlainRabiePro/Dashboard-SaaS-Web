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

const EXAMPLE_TESTS = {
  'sum.test.js': `describe('Math operations', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
  });

  test('multiplies 5 * 3 to equal 15', () => {
    expect(5 * 3).toBe(15);
  });

  test('subtracts 10 - 4 to equal 6', () => {
    expect(10 - 4).toBe(6);
  });
});
`,
  
  'string.test.js': `describe('String operations', () => {
  test('checks if string contains word', () => {
    const message = 'hello world';
    expect(message).toContain('world');
  });

  test('converts string to uppercase', () => {
    const text = 'hello';
    expect(text.toUpperCase()).toBe('HELLO');
  });

  test('checks string length', () => {
    const text = 'javascript';
    expect(text.length).toBe(10);
  });
});
`,

  'array.test.js': `describe('Array operations', () => {
  test('checks if array contains element', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toContain('banana');
  });

  test('filters array correctly', () => {
    const numbers = [1, 2, 3, 4, 5];
    const even = numbers.filter(n => n % 2 === 0);
    expect(even).toEqual([2, 4]);
  });

  test('maps array values', () => {
    const nums = [1, 2, 3];
    const doubled = nums.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
`,

  'async.test.js': `describe('Async operations', () => {
  test('resolves promise correctly', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  test('handles async function', async () => {
    const asyncFunc = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('done'), 100);
      });
    };
    
    const result = await asyncFunc();
    expect(result).toBe('done');
  });

  test('rejects promise with error', async () => {
    const failPromise = Promise.reject(new Error('failed'));
    await expect(failPromise).rejects.toThrow('failed');
  });
});
`
};

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
    
    // Utiliser le domaine réel
    let domain = projectData?.name || projectData?.siteName || projectData?.domain || projectId;
    const normalizedDomain = domain.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;

    // ✅ Créer les fichiers de test d'exemple via SSH
    const result = await createExampleTests(projectPath);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de la création', details: result.details },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fichiers de test d\'exemple créés avec succès',
      files: result.files
    });
  } catch (error) {
    console.error('❌ Error creating example tests:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création des tests d\'exemple', details: String(error) },
      { status: 500 }
    );
  }
}

// ✅ Create example test files via SSH
const createExampleTests = async (projectPath: string): Promise<{ success: boolean; error?: string; details?: string; files?: string[] }> => {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    console.log(`[CREATE-TESTS] Creating example test files in ${projectPath}...`);

    // Créer le répertoire __tests__
    const mkdirCmd = `mkdir -p "${projectPath}/__tests__"`;
    const mkdirResult = await ssh.execCommand(mkdirCmd);
    
    if (mkdirResult.code !== 0) {
      ssh.dispose();
      return { success: false, error: 'Impossible de créer le répertoire __tests__', details: mkdirResult.stderr };
    }

    const createdFiles: string[] = [];
    let hasErrors = false;
    let errorDetails = '';

    // Créer chaque fichier de test
    for (const [filename, content] of Object.entries(EXAMPLE_TESTS)) {
      const filePath = `${projectPath}/__tests__/${filename}`;
      
      // Échapper le contenu pour la sécurité
      const escapedContent = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\$/g, '\\$');
      
      const writeCmd = `echo -e "${escapedContent}" > "${filePath}"`;
      const writeResult = await ssh.execCommand(writeCmd);
      
      if (writeResult.code === 0) {
        createdFiles.push(filename);
        console.log(`✅ Created: ${filename}`);
      } else {
        hasErrors = true;
        errorDetails += `${filename}: ${writeResult.stderr}\n`;
        console.error(`❌ Failed to create ${filename}: ${writeResult.stderr}`);
      }
    }

    ssh.dispose();

    if (createdFiles.length === 0) {
      return { success: false, error: 'Aucun fichier n\'a pu être créé', details: errorDetails };
    }

    return { 
      success: true, 
      files: createdFiles,
      details: hasErrors ? `${createdFiles.length}/${Object.keys(EXAMPLE_TESTS).length} fichiers créés avec succès` : undefined
    };
  } catch (error: any) {
    console.error('❌ SSH Error:', error.message);
    return { success: false, error: error.message };
  }
};
