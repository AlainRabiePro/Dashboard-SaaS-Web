import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, initializeApp, getApps } from 'firebase/firestore';

/**
 * API pour récupérer les données Firestore d'un projet
 * 
 * Body (POST):
 * {
 *   siteId: string,
 *   firebaseConfig: { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, firebaseConfig } = body;

    if (!siteId || !firebaseConfig) {
      return NextResponse.json({ error: 'Missing siteId or firebaseConfig' }, { status: 400 });
    }

    // Initialiser une connexion Firestore avec la config du site
    const appName = `site-${siteId}`;
    let db;

    try {
      // Essayer d'utiliser une app déjà initialisée
      const existingApp = getApps().find(a => a.name === appName);
      if (existingApp) {
        db = getFirestore(existingApp);
      } else {
        // Créer une nouvelle app avec cette configuration
        const app = initializeApp(firebaseConfig, appName);
        db = getFirestore(app);
      }
    } catch (error: any) {
      console.error('Error initializing Firestore:', error);
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 400 }
      );
    }

    // Récupérer les données du site depuis sa propre base
    const collections_data = await fetchCollections(db, userId, siteId);

    return NextResponse.json({
      siteId,
      collections: collections_data,
    });
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Récupère les collections d'une base Firestore
 */
async function fetchCollections(targetDb: any, userId: string, siteId: string) {
  try {
    // Pour chaque site, on peut avoir les données à la racine ou sous un chemin spécifique
    // Par défaut, on essaie de lire sous la structure /users/{userId}/sites/{siteId}/*
    
    // Ou simplement lire les collections racine disponibles
    // Ici on va lire les collections communes que les utilisateurs peuvent avoir

    const collections_list: any = {};

    // Lister les collections courantes
    const commonCollections = ['sites', 'domains', 'deploymentLogs', 'configs', 'data', 'logs'];

    for (const collName of commonCollections) {
      try {
        const collRef = collection(targetDb, collName);
        const snap = await getDocs(collRef);
        
        if (snap.size > 0) {
          collections_list[collName] = {
            name: collName,
            count: snap.size,
            data: snap.docs.slice(0, 10).map(doc => ({ id: doc.id, ...doc.data() })), // Limiter à 10
          };
        }
      } catch (error) {
        // Cette collection n'existe peut-être pas ou on n'a pas d'accès
        console.debug(`Collection ${collName} not accessible:`, error);
      }
    }

    return collections_list;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}
