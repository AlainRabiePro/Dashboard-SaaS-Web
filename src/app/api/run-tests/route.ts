import { NextRequest, NextResponse } from 'next/server';

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

// Exécuter les tests via SSH
async function runTestsViaSSH(siteId: string, suiteId: string): Promise<TestResult> {
  try {
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

    // Execute via the console execute API
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' + '/api/console/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command,
        projectName: siteId,
        projectPath: siteId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to execute tests');
    }

    const result = await response.json();
    const output = result.output || '';

    // Parse test results
    let stats = {
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0,
    };

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
        }
      }
    } catch (e) {
      console.log('Could not parse JSON test results');
    }

    // Fallback: Parse text output
    if (stats.total === 0) {
      const passMatch = output.match(/(\d+)\s+passed/i);
      const failMatch = output.match(/(\d+)\s+failed/i);
      const durationMatch = output.match(/(\d+(?:\.\d+)?)\s*s/i);

      stats.passed = passMatch ? parseInt(passMatch[1]) : 0;
      stats.failed = failMatch ? parseInt(failMatch[1]) : 0;
      stats.total = stats.passed + stats.failed || 1;
      stats.duration = durationMatch ? Math.round(parseFloat(durationMatch[1]) * 1000) : 0;
    }

    // Get commit hash if available
    let commitHash = '';
    const commitResponse = await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000' + '/api/console/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'git rev-parse --short HEAD 2>&1',
        projectName: siteId,
        projectPath: siteId,
      }),
    });

    if (commitResponse.ok) {
      const commitResult = await commitResponse.json();
      commitHash = (commitResult.output || '').trim();
    }

    return {
      id: `test-${Date.now()}`,
      suiteId,
      status: stats.failed === 0 && stats.total > 0 ? 'passed' : stats.total > 0 ? 'failed' : 'passed',
      passed: stats.passed,
      failed: stats.failed,
      total: Math.max(stats.total, 1),
      duration: stats.duration,
      date: new Date().toLocaleString('fr-FR'),
      commitHash: commitHash || undefined,
    };

  } catch (error) {
    console.error('[RUN-TESTS] SSH Error:', error);
    
    // Fallback: Return error result
    return {
      id: `test-${Date.now()}`,
      suiteId,
      status: 'failed',
      passed: 0,
      failed: 1,
      total: 1,
      duration: 0,
      date: new Date().toLocaleString('fr-FR'),
    };
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
    const testResult = await runTestsViaSSH(siteId, suiteId);

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
        date: new Date().toLocaleString('fr-FR'),
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
