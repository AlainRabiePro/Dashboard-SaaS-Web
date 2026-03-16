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

interface TestRunRequest {
  siteId: string;
  suiteId: string;
  userId: string;
}

interface TestResult {
  id: string;
  suiteId: string;
  status: 'passed' | 'failed' | 'running';
  passed: number;
  failed: number;
  total: number;
  duration: number;
  date: string;
  commitHash?: string;
  deploymentId?: string;
  output?: string;
  error?: string;
}

// Exécuter les tests via SSH
async function runTestsViaSSH(siteId: string, suiteId: string, userId: string): Promise<TestResult> {
  try {
    // ✅ Récupérer le domaine réel du site depuis Firestore
    let projectPath: string | null = null;
    let siteInfo = { domain: '', siteName: '', name: '' };
    
    try {
      const siteRef = doc(db, 'users', userId, 'sites', siteId);
      const siteSnap = await getDoc(siteRef);
      
      if (siteSnap.exists()) {
        const siteData = siteSnap.data();
        siteInfo = {
          domain: siteData?.domain || '',
          siteName: siteData?.siteName || '',
          name: siteData?.name || '',
        };
        
        console.log(`[RUN-TESTS] Site info from Firestore:`, siteInfo);
        
        // Priorité: name -> siteName -> domain (car name est plus fiable)
        // name contient le domaine réel (ex: instacraft.fr)
        const domainToUse = siteInfo.name || siteInfo.siteName || siteInfo.domain;
        
        if (domainToUse && domainToUse !== siteId) {
          const normalizedDomain = domainToUse.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
          projectPath = `/var/www/${normalizedDomain}`;
          console.log(`[RUN-TESTS] Using domain from Firestore (name field): ${projectPath}`);
        }
      } else {
        console.warn('⚠️  Site not found in Firestore:', siteId);
      }
    } catch (firestoreError) {
      console.warn('⚠️  Could not fetch site from Firestore:', firestoreError);
    }

    // Si on n'a pas trouvé le domaine, utiliser l'ID en dernier recours
    if (!projectPath) {
      const normalizedId = siteId.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
      projectPath = `/var/www/${normalizedId}`;
      console.warn(`[RUN-TESTS] Using siteId as fallback: ${projectPath}`);
    }

    // Map suite IDs to test commands
    const testCommands: Record<string, string> = {
      'unit-tests': 'npm test -- --json --passWithNoTests 2>&1',
      'integration-tests': 'npm run test:integration -- --json --passWithNoTests 2>&1 || true',
      'e2e-tests': 'npm run test:e2e -- --json --passWithNoTests 2>&1 || true',
    };

    const command = testCommands[suiteId];
    if (!command) {
      throw new Error('Unknown test suite');
    }

    // ✅ FIXED: Execute directly via SSH instead of fetch
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    try {
      await ssh.connect({
        host: process.env.DEPLOY_SSH_HOST,
        username: process.env.DEPLOY_SSH_USER,
        password: process.env.DEPLOY_SSH_PASSWORD,
      });

      // ✅ Vérifier si le chemin existe, sinon essayer d'autres variantes
      let testPath = projectPath;
      let pathExists = false;
      
      // Essayer le chemin principal d'abord
      let checkCmd = `test -d "${testPath}" && echo "exists" || echo "not-found"`;
      let checkResult = await ssh.execCommand(checkCmd);
      pathExists = checkResult.stdout.includes('exists');
      
      console.log(`[RUN-TESTS] Checking path: ${testPath} -> ${pathExists ? 'EXISTS' : 'NOT FOUND'}`);
      
      // Si le chemin n'existe pas et qu'on a un nom, essayer avec le nom normalisé
      if (!pathExists && siteInfo.name) {
        const alternativePath = `/var/www/${siteInfo.name.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-')}`;
        checkCmd = `test -d "${alternativePath}" && echo "exists" || echo "not-found"`;
        checkResult = await ssh.execCommand(checkCmd);
        
        if (checkResult.stdout.includes('exists')) {
          testPath = alternativePath;
          pathExists = true;
          console.log(`[RUN-TESTS] Found alternative path: ${testPath}`);
        }
      }
      
      // Si toujours pas trouvé, lister les répertoires disponibles
      if (!pathExists) {
        console.warn(`[RUN-TESTS] Path not found: ${testPath}`);
        console.warn(`[RUN-TESTS] Attempting to list /var/www contents...`);
        const listResult = await ssh.execCommand('ls -la /var/www | grep "^d" | tail -20');
        console.warn(`[RUN-TESTS] Available directories:\n${listResult.stdout}`);
      }

      // ✅ Vérifier si Jest est installé et l'installer si besoin
      console.log(`[RUN-TESTS] Checking if Jest is installed...`);
      let checkJestCmd = `cd "${testPath}" && npm list jest 2>&1 | grep -i "jest@" || echo "jest-not-found"`;
      let checkJestResult = await ssh.execCommand(checkJestCmd);
      const hasJest = !checkJestResult.stdout.includes('jest-not-found') && checkJestResult.stdout.includes('jest');
      
      if (!hasJest) {
        console.log(`[RUN-TESTS] Jest not found, installing it...`);
        const installJestCmd = `cd "${testPath}" && npm install --save-dev jest @types/jest 2>&1`;
        const installJestResult = await ssh.execCommand(installJestCmd);
        console.log(`[RUN-TESTS] Jest installation output:\n${installJestResult.stdout.substring(0, 500)}`);
      } else {
        console.log(`[RUN-TESTS] Jest is already installed`);
      }

      // Navigate to project directory and run tests
      const fullCommand = `cd "${testPath}" && ${command}`;

      console.log(`[RUN-TESTS] Final path: ${testPath}`);
      console.log(`[RUN-TESTS] Executing on VPS: ${fullCommand}`);
      
      const result = await ssh.execCommand(fullCommand);
      const output = result.stdout || result.stderr || '';

      console.log(`[RUN-TESTS] Command output length: ${output.length}`);
      console.log(`[RUN-TESTS] Command exit code: ${result.code}`);
      console.log(`[RUN-TESTS] Output preview: ${output.substring(0, 500)}`);

      // Parse test results
      let stats = {
        passed: 0,
        failed: 0,
        total: 0,
        duration: 0,
      };
      
      let errorMessage = '';

      // ✅ Détecter les erreurs courantes
      if (output.includes('Missing script:') || output.includes('ERR! missing script:')) {
        errorMessage = 'Le script de test n\'est pas configuré. Veuillez ajouter un script "test" dans le package.json';
        console.error(`[RUN-TESTS] Error: ${errorMessage}`);
        stats.failed = 1;
        stats.total = 1;
      } else if (output.includes('jest: not found') || output.includes('sh: 1: jest: not found')) {
        errorMessage = 'Jest n\'est pas installé. Exécutez "npm install" pour installer les dépendances.';
        console.error(`[RUN-TESTS] Error: ${errorMessage}`);
        stats.failed = 1;
        stats.total = 1;
      } else if (output.includes('Cannot find module') || output.includes('Error: Command failed')) {
        errorMessage = 'Erreur d\'exécution des tests. Vérifiez que les dépendances sont installées avec "npm install".';
        console.error(`[RUN-TESTS] Error: ${errorMessage}`);
        stats.failed = 1;
        stats.total = 1;
      } else {
        let jsonParsed = false;
        try {
          // Try to parse JSON output from Jest
          const jsonMatch = output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.numPassedTests !== undefined) {
              stats.passed = parsed.numPassedTests || 0;
              stats.failed = parsed.numFailedTests || 0;
              stats.total = (parsed.numPassedTests || 0) + (parsed.numFailedTests || 0);
              stats.duration = Math.round((parsed.testResults?.[0]?.perfStats?.end - parsed.testResults?.[0]?.perfStats?.start) || 0);
              jsonParsed = true;
              console.log(`[RUN-TESTS] JSON parsing success:`, stats);
            }
          } else {
            console.log('⚠️  No JSON found in output');
          }
        } catch (e) {
          console.log('⚠️  Could not parse JSON test results:', e);
        }

        // Fallback: Parse text output (uniquement si le JSON n'a pas réussi)
        if (!jsonParsed && stats.total === 0) {
          console.log('[RUN-TESTS] Using text fallback parsing...');
          const passMatch = output.match(/(\d+)\s+passed/i);
          const failMatch = output.match(/(\d+)\s+failed/i);
          const durationMatch = output.match(/(\d+(?:\.\d+)?)\s*s/i);

          const passCount = passMatch ? parseInt(passMatch[1]) : 0;
          const failCount = failMatch ? parseInt(failMatch[1]) : 0;
          
          stats.passed = passCount;
          stats.failed = failCount;
          stats.total = passCount + failCount || 0;
          stats.duration = durationMatch ? Math.round(parseFloat(durationMatch[1]) * 1000) : 0;
          
          console.log(`[RUN-TESTS] Text parsing result:`, stats);
        }
      }

      // Get commit hash if available
      let commitHash = '';
      try {
        const commitResult = await ssh.execCommand('cd "' + projectPath + '" && git rev-parse HEAD 2>/dev/null || echo ""');
        commitHash = commitResult.stdout?.trim() || '';
      } catch (e) {
        console.warn('Could not get commit hash');
      }

      ssh.dispose();

      return {
        id: `${siteId}-${suiteId}-${Date.now()}`,
        suiteId,
        // ✅ FIX: Statut cohérent avec les résultats
        status: stats.failed > 0 || stats.passed === 0 ? 'failed' : 'passed',
        ...stats,
        date: new Date().toISOString(),
        commitHash,
        output: output,
        error: errorMessage || undefined,
      };
    } catch (sshError) {
      console.error('❌ SSH execution error:', sshError);
      ssh.dispose();
      throw sshError;
    }
  } catch (error: any) {
    console.error('[RUN-TESTS] Error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TestRunRequest;
    const { siteId, suiteId, userId } = body;

    if (!siteId || !suiteId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Exécuter les tests via SSH
    const testResult = await runTestsViaSSH(siteId, suiteId, userId);

    return NextResponse.json(testResult, { status: 200 });
  } catch (error) {
    console.error('Error in run-tests:', error);
    return NextResponse.json(
      {
        id: `test-${Date.now()}`,
        suiteId: 'unknown',
        status: 'failed' as const,
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0,
        date: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
