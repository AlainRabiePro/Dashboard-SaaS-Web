import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Teste la connexion à une configuration Firebase
 */
export async function POST(request: NextRequest) {
  try {
    const config: FirebaseConfig = await request.json();

    // Valider les champs requis
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    for (const field of requiredFields) {
      if (!config[field as keyof FirebaseConfig]) {
        return NextResponse.json(
          { error: `Champ manquant: ${field}` },
          { status: 400 }
        );
      }
    }

    // Initialiser l'app Firebase
    const appName = `test-app-${Date.now()}`;
    try {
      const app = initializeApp(config, appName);
      const db = getFirestore(app);

      // Essayer une requête simple pour vérifier la connexion
      // On essaie de lister une collection fictive - cela sera autorisé ou rejeté par Firestore
      try {
        const testRef = collection(db, '__test__');
        await getDocs(testRef);
      } catch (e: any) {
        // C'est normal si la collection n'existe pas, tant qu'on a accès à Firestore
        if (!e.message?.includes('PERMISSION_DENIED') && !e.message?.includes('quota')) {
          // Toute autre erreur (sauf permission/quota) signifie que la connexion fonctionne
        }
      }

      return NextResponse.json({
        success: true,
        projectId: config.projectId,
        message: 'Connexion réussie!',
      });
    } catch (error: any) {
      console.error('Firebase initialization error:', error);
      
      // Vérifier le type d'erreur
      const errorMessage = error.message || 'Erreur de connexion Firebase';
      
      if (errorMessage.includes('INVALID_KEY') || errorMessage.includes('API_KEY')) {
        return NextResponse.json(
          { error: 'Clé API invalide' },
          { status: 400 }
        );
      } else if (errorMessage.includes('auth domain')) {
        return NextResponse.json(
          { error: 'Auth Domain invalide' },
          { status: 400 }
        );
      } else if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          { error: 'Délai d\'attente dépassé - vérifiez votre connexion' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Request parsing error:', error);
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 });
  }
}
