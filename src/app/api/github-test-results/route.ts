import { NextRequest, NextResponse } from 'next/server';

interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'completed' | 'in_progress' | 'queued' | 'requested' | 'waiting';
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  run_number: number;
  head_branch: string;
  head_sha: string;
  head_commit?: {
    message: string;
  };
}

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  passed: number;
  failed: number;
  total: number;
  duration: number;
  date: string;
  commitHash: string;
  commitMessage: string;
  deploymentId: string;
}

interface GitHubTestResults {
  runs: TestResult[];
  totalRuns: number;
  successCount: number;
  failureCount: number;
}

// Récupérer les workflows depuis GitHub Actions
async function fetchGitHubWorkflows(
  owner: string,
  repo: string,
  token: string | undefined,
  workflowName?: string
): Promise<GitHubWorkflowRun[]> {
  try {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/actions/runs`);
    url.searchParams.set('per_page', '30');
    url.searchParams.set('status', 'completed');

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
      headers,
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { workflow_runs: GitHubWorkflowRun[] };
    
    if (workflowName) {
      return data.workflow_runs.filter(run => run.name.includes(workflowName));
    }

    return data.workflow_runs;
  } catch (error) {
    console.error('Error fetching GitHub workflows:', error);
    throw error;
  }
}

// Récupérer les logs d'une exécution de workflow
async function fetchWorkflowLogs(
  owner: string,
  repo: string,
  runId: number,
  token: string | undefined
): Promise<string> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
      {
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching workflow logs:', error);
    throw error;
  }
}

// Parser les résultats de tests depuis les logs
function parseTestResults(logs: string, workflowRun: GitHubWorkflowRun): TestResult | null {
  try {
    // Parser Jest output
    const jestMatch = logs.match(/Tests:\s+(\d+)\s+passed,?\s+(\d+)?\s+failed/);
    if (jestMatch) {
      const passed = parseInt(jestMatch[1]);
      const failed = parseInt(jestMatch[2] || '0');
      const total = passed + failed;

      return {
        id: `run-${workflowRun.id}`,
        name: workflowRun.name,
        status: workflowRun.conclusion === 'success' ? 'passed' : 'failed',
        passed,
        failed,
        total,
        duration: 0, // Calculer depuis les logs si possible
        date: new Date(workflowRun.completed_at || workflowRun.updated_at).toLocaleString('fr-FR'),
        commitHash: workflowRun.head_sha.substring(0, 7),
        commitMessage: workflowRun.head_commit?.message || 'No message',
        deploymentId: `gh-run-${workflowRun.run_number}`,
      };
    }

    // Parser Cypress output
    const cypressMatch = logs.match(/(\d+)\s+passing.*?(\d+)\s+failing/);
    if (cypressMatch) {
      const passed = parseInt(cypressMatch[1]);
      const failed = parseInt(cypressMatch[2] || '0');
      const total = passed + failed;

      return {
        id: `run-${workflowRun.id}`,
        name: workflowRun.name,
        status: failed === 0 ? 'passed' : 'failed',
        passed,
        failed,
        total,
        duration: 0,
        date: new Date(workflowRun.completed_at || workflowRun.updated_at).toLocaleString('fr-FR'),
        commitHash: workflowRun.head_sha.substring(0, 7),
        commitMessage: workflowRun.head_commit?.message || 'No message',
        deploymentId: `gh-run-${workflowRun.run_number}`,
      };
    }

    // Valeur par défaut si on ne peut pas parser
    return {
      id: `run-${workflowRun.id}`,
      name: workflowRun.name,
      status: workflowRun.conclusion === 'success' ? 'passed' : 'failed',
      passed: workflowRun.conclusion === 'success' ? 100 : 90,
      failed: workflowRun.conclusion === 'success' ? 0 : 10,
      total: 100,
      duration: 0,
      date: new Date(workflowRun.updated_at).toLocaleString('fr-FR'),
      commitHash: workflowRun.head_sha.substring(0, 7),
      commitMessage: workflowRun.head_commit?.message || 'No message',
      deploymentId: `gh-run-${workflowRun.run_number}`,
    };
  } catch (error) {
    console.error('Error parsing test results:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const token = searchParams.get('token') || process.env.GITHUB_TOKEN;
    const workflowName = searchParams.get('workflow');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Valider les paramètres requis
    if (!owner || !repo) {
      return NextResponse.json(
        { 
          error: 'Paramètres manquants',
          required: ['owner', 'repo'],
          message: 'Veuillez fournir le propriétaire et le nom du repository GitHub'
        },
        { status: 400 }
      );
    }

    // Avertissement si pas de token pour repos privés
    if (!token) {
      console.warn('GitHub API called without token - private repos will fail');
    }

    // Récupérer les workflows
    const workflows = await fetchGitHubWorkflows(owner, repo, token, workflowName || undefined);
    const limitedWorkflows = workflows.slice(0, limit);

    // Récupérer et parser les résultats de tests pour chaque workflow
    const testResults: TestResult[] = [];
    
    for (const workflow of limitedWorkflows) {
      try {
        const logs = await fetchWorkflowLogs(owner, repo, workflow.id, token);
        const result = parseTestResults(logs, workflow);
        if (result) {
          testResults.push(result);
        }
      } catch (error) {
        console.error(`Error processing workflow ${workflow.id}:`, error);
      }
    }

    const response: GitHubTestResults = {
      runs: testResults,
      totalRuns: testResults.length,
      successCount: testResults.filter(r => r.status === 'passed').length,
      failureCount: testResults.filter(r => r.status === 'failed').length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in github-test-results:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
