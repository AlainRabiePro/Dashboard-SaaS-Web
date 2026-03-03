import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source: string;
  stack?: string;
}

// Simuler les logs (en production, récupérer desde une BDD)
const generateMockLogs = (): LogEntry[] => {
  const now = new Date();
  return [
    {
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info',
      message: 'Application démarrée avec succès',
      source: 'main.ts'
    },
    {
      timestamp: new Date(now.getTime() - 45000).toISOString(),
      level: 'info',
      message: 'Connexion à Firebase établie',
      source: 'firebase/config.ts'
    },
    {
      timestamp: new Date(now.getTime() - 30000).toISOString(),
      level: 'debug',
      message: 'Requête API: GET /api/users',
      source: 'api/users/route.ts'
    },
    {
      timestamp: new Date(now.getTime() - 20000).toISOString(),
      level: 'warn',
      message: 'Dépréciation: Utilisez la nouvelle API v2 au lieu de v1',
      source: 'middleware.ts'
    },
    {
      timestamp: new Date(now.getTime() - 10000).toISOString(),
      level: 'info',
      message: 'Utilisateur authentifié: user@example.com',
      source: 'auth/provider.tsx'
    },
    {
      timestamp: new Date(now.getTime() - 5000).toISOString(),
      level: 'debug',
      message: 'Données Firestore chargées: 42 documents',
      source: 'firestore-service.ts'
    },
    {
      timestamp: new Date(now.getTime() - 2000).toISOString(),
      level: 'info',
      message: 'Export PDF généré avec succès',
      source: 'lib/pdf-generator.ts'
    },
  ];
};

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const logs = generateMockLogs();

    return NextResponse.json({
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des logs' },
      { status: 500 }
    );
  }
}
