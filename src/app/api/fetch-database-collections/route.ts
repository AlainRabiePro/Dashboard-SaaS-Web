import { NextRequest, NextResponse } from 'next/server';
import type { DatabaseType } from '@/lib/database-types';

interface FetchRequest {
  siteId: string;
  databaseId: string;
  type: DatabaseType;
  config: any;
}

/**
 * Récupère les collections/tables d'une base de données
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FetchRequest = await request.json();
    const { siteId, databaseId, type, config } = body;

    switch (type) {
      case 'firestore':
        return await fetchFirestoreCollections(config);
      case 'supabase':
        return await fetchSupabaseCollections(config);
      case 'mysql':
      case 'mariadb':
        return await fetchMySQLTables(config);
      case 'postgresql':
        return await fetchPostgresTables(config);
      case 'mongodb':
        return await fetchMongoDBCollections(config);
      default:
        return NextResponse.json({ error: 'Type non supporté' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Récupère les collections Firestore
 */
async function fetchFirestoreCollections(config: any) {
  try {
    // Importer dynamiquement les dépendances Firestore côté serveur
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, getDocs, collection } = await import('firebase/firestore');

    const appName = `firestore-${Date.now()}`;
    let db;

    try {
      const app = initializeApp(config, appName);
      db = getFirestore(app);
    } catch (e) {
      // App déjà initialisée
      const existingApp = getApps().find(a => a.name === appName);
      db = getFirestore(existingApp!);
    }

    // Lister les collections (limité car Firestore n'a pas d'API native)
    const collections_data: any = {};
    const commonCollections = ['sites', 'domains', 'deploymentLogs', 'configs', 'data', 'logs', 'users'];

    for (const collName of commonCollections) {
      try {
        const collRef = collection(db, collName);
        const snap = await getDocs(collRef);

        if (snap.size > 0) {
          collections_data[collName] = {
            name: collName,
            count: snap.size,
            type: 'collection',
            data: snap.docs.slice(0, 5).map(doc => ({ id: doc.id, ...doc.data() })),
          };
        }
      } catch (e) {
        // Collection doesn't exist
      }
    }

    return NextResponse.json({
      type: 'firestore',
      collections: collections_data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur Firestore' },
      { status: 400 }
    );
  }
}

/**
 * Récupère les tables Supabase
 */
async function fetchSupabaseCollections(config: any) {
  try {
    const { projectUrl, anonKey } = config;

    // Utiliser l'API PostgreSQL de Supabase
    const response = await fetch(
      `${projectUrl}/rest/v1/information_schema.tables?schema=eq.public`,
      {
        headers: {
          'apiKey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erreur Supabase: ${response.statusText}` },
        { status: 400 }
      );
    }

    const tables = await response.json();
    const collections_data: any = {};

    for (const table of tables.slice(0, 10)) {
      collections_data[table.table_name] = {
        name: table.table_name,
        count: 0, // Supabase ne fournit pas le count facilement
        type: 'table',
      };
    }

    return NextResponse.json({
      type: 'supabase',
      collections: collections_data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur Supabase' },
      { status: 400 }
    );
  }
}

/**
 * Récupère les tables MySQL/MariaDB
 */
async function fetchMySQLTables(config: any) {
  // Pour MySQL/MariaDB, on ne peut pas vraiment faire une requête côté serveur sans mysql2/promise
  // On retourne un message d'info
  return NextResponse.json({
    type: 'mysql',
    collections: {
      info: {
        name: 'Informations de connexion',
        count: 0,
        type: 'table',
        data: [{
          message: 'Pour accéder aux tables MySQL/MariaDB, utilisez phpMyAdmin ou votre client SQL préféré',
          host: config.host,
          database: config.database,
        }],
      },
    },
  });
}

/**
 * Récupère les tables PostgreSQL
 */
async function fetchPostgresTables(config: any) {
  // Même logique que MySQL - nécessite un client PostgreSQL
  return NextResponse.json({
    type: 'postgresql',
    collections: {
      info: {
        name: 'Informations de connexion',
        count: 0,
        type: 'table',
        data: [{
          message: 'Pour accéder aux tables PostgreSQL, utilisez pgAdmin ou votre client SQL préféré',
          host: config.host,
          database: config.database,
        }],
      },
    },
  });
}

/**
 * Récupère les collections MongoDB
 */
async function fetchMongoDBCollections(config: any) {
  try {
    // Pour MongoDB, nécessite mongoose ou mongodb client
    // On retourne une info
    return NextResponse.json({
      type: 'mongodb',
      collections: {
        info: {
          name: 'Informations de connexion',
          count: 0,
          type: 'collection',
          data: [{
            message: 'Pour accéder aux collections MongoDB, utilisez MongoDB Compass ou votre client préféré',
            database: config.database,
          }],
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
