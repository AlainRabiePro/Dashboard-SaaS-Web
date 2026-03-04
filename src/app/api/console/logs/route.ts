import { NextRequest, NextResponse } from 'next/server';
import { getProjectLogs } from '@/lib/logs-store';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const projectId = request.headers.get('x-project-id');

  if (!userId || !projectId) {
    return NextResponse.json(
      { error: 'userId et projectId requis' },
      { status: 400 }
    );
  }

  try {
    const projectLogs = getProjectLogs(projectId);

    return NextResponse.json({
      logs: projectLogs.logs,
      timestamp: projectLogs.timestamp,
      count: projectLogs.logs.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors du chargement des logs' },
      { status: 500 }
    );
  }
}
