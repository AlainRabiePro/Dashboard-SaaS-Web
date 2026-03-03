import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

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
}

// Initialiser Firebase
const apps = getApps();
const app = apps.length > 0 ? apps[0] : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

// Exécuter les tests en local
async function runLocalTests(suiteId: string): Promise<TestResult> {
  try {
    // Simuler l'exécution des tests
    // En production, vous appelleriez npm test ou un autre script
    let passed = 0;
    let failed = 0;
    let total = 0;

    switch (suiteId) {
      case 'unit-tests':
        total = 145;
        failed = Math.floor(Math.random() * 5) === 0 ? 3 : 0; // 20% chance d'échec
        passed = total - failed;
        break;
      case 'integration-tests':
        total = 58;
        failed = Math.floor(Math.random() * 8) === 0 ? 2 : 0; // 12.5% chance d'échec
        passed = total - failed;
        break;
      case 'e2e-tests':
        total = 32;
        failed = Math.floor(Math.random() * 10) === 0 ? 1 : 0; // 10% chance d'échec
        passed = total - failed;
        break;
      default:
        total = 100;
        failed = 0;
        passed = total;
    }

    const duration = Math.floor(Math.random() * 10000) + 1000; // 1-11 secondes

    return {
      id: `run-${Date.now()}`,
      suiteId,
      status: failed > 0 ? 'failed' : 'passed',
      passed,
      failed,
      total,
      duration,
      date: new Date().toLocaleString('fr-FR'),
      commitHash: Math.random().toString(36).substring(7),
    };
  } catch (error) {
    console.error('Error running tests:', error);
    throw new Error('Failed to run tests');
  }
}

// Exécuter les tests via npm
async function runNpmTests(suiteId: string): Promise<TestResult> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    let command = '';
    switch (suiteId) {
      case 'unit-tests':
        command = 'npm run test:unit -- --coverage';
        break;
      case 'integration-tests':
        command = 'npm run test:integration -- --coverage';
        break;
      case 'e2e-tests':
        command = 'npm run test:e2e -- --headless';
        break;
      default:
        command = 'npm test';
    }

    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(command, { timeout: 600000 }); // 10 min timeout
    const duration = Date.now() - startTime;

    // Parser les résultats (simplifié - adapter selon votre format)
    const passedMatch = stdout.match(/(\d+) passed/);
    const failedMatch = stdout.match(/(\d+) failed/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = passed + failed;

    return {
      id: `run-${Date.now()}`,
      suiteId,
      status: failed > 0 ? 'failed' : 'passed',
      passed,
      failed,
      total,
      duration,
      date: new Date().toLocaleString('fr-FR'),
      commitHash: (await execAsync('git rev-parse --short HEAD')).stdout.trim(),
    };
  } catch (error) {
    console.error('Error running npm tests:', error);
    throw new Error('Failed to run npm tests');
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

    // Récupérer le site depuis Firestore
    const siteRef = doc(db, 'users', userId, 'sites', siteId);
    const siteSnap = await getDoc(siteRef);

    if (!siteSnap.exists()) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Exécuter les tests
    const testResult = await runLocalTests(suiteId);
    // Alternative: await runNpmTests(suiteId);

    // Sauvegarder le résultat en Firestore
    const testRunsRef = doc(db, 'users', userId, 'sites', siteId, 'testRuns', testResult.id);
    await updateDoc(siteRef, {
      lastTestRun: testResult.date,
      testRunsCount: (siteSnap.data().testRunsCount || 0) + 1,
    });

    return NextResponse.json(testResult, { status: 200 });
  } catch (error) {
    console.error('Error in run-tests:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
