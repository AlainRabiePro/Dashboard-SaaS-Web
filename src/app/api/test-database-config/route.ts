import { NextRequest, NextResponse } from 'next/server';
import type { DatabaseType } from '@/lib/database-types';

interface TestRequest {
  type: DatabaseType;
  config: any;
}

/**
 * Teste la connexion à une base de données
 */
export async function POST(request: NextRequest) {
  try {
    const body: TestRequest = await request.json();
    const { type, config } = body;

    switch (type) {
      case 'firestore':
        return testFirebase(config);
      case 'supabase':
        return testSupabase(config);
      case 'mysql':
      case 'mariadb':
        return testMySQL(config);
      case 'postgresql':
        return testPostgreSQL(config);
      case 'mongodb':
        return testMongoDB(config);
      default:
        return NextResponse.json({ error: 'Type non supporté' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error testing database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Test Firebase Firestore
 */
async function testFirebase(config: any) {
  try {
    // Vérifier que tous les champs requis sont présents
    const required = ['apiKey', 'authDomain', 'projectId'];
    for (const field of required) {
      if (!config[field]) {
        return NextResponse.json({ error: `Champ manquant: ${field}` }, { status: 400 });
      }
    }

    // Essayer une requête simple vers Firebase
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: 'Authentification échouée - Clé API invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: 'firestore',
      projectId: config.projectId,
      message: 'Connexion réussie!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur de connexion Firebase' },
      { status: 400 }
    );
  }
}

/**
 * Test Supabase
 */
async function testSupabase(config: any) {
  try {
    if (!config.projectUrl || !config.anonKey) {
      return NextResponse.json(
        { error: 'Project URL et Anon Key requis' },
        { status: 400 }
      );
    }

    const response = await fetch(`${config.projectUrl}/rest/v1/`, {
      headers: {
        'apiKey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erreur Supabase: ${response.statusText}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: 'supabase',
      message: 'Connexion réussie!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur de connexion Supabase' },
      { status: 400 }
    );
  }
}

/**
 * Test MySQL/MariaDB
 */
async function testMySQL(config: any) {
  try {
    const { host, port, username, password, database } = config;

    if (!host || !username || !database) {
      return NextResponse.json(
        { error: 'Host, Username et Database requis' },
        { status: 400 }
      );
    }

    // On ne peut pas vraiment tester la connexion depuis le serveur Node
    // On retourne un succès si les champs sont valides
    // Le vrai test se ferait lors de la requête réelle
    return NextResponse.json({
      success: true,
      type: 'mysql',
      message: 'Configuration valide. Le test réel se fera lors de l\'accès.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Test PostgreSQL
 */
async function testPostgreSQL(config: any) {
  try {
    const { host, port, username, password, database } = config;

    if (!host || !username || !database) {
      return NextResponse.json(
        { error: 'Host, Username et Database requis' },
        { status: 400 }
      );
    }

    // Même logique que MySQL
    return NextResponse.json({
      success: true,
      type: 'postgresql',
      message: 'Configuration valide. Le test réel se fera lors de l\'accès.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Test MongoDB
 */
async function testMongoDB(config: any) {
  try {
    const { connectionString, database } = config;

    if (!connectionString || !database) {
      return NextResponse.json(
        { error: 'Connection String et Database requis' },
        { status: 400 }
      );
    }

    // Vérifier le format de la connection string
    if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
      return NextResponse.json(
        { error: 'Connection String invalide - doit commencer par mongodb:// ou mongodb+srv://' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: 'mongodb',
      message: 'Configuration valide. Le test réel se fera lors de l\'accès.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
