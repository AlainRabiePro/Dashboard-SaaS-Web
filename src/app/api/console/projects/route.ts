import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

interface Project {
  id: string;
  name: string;
  domain: string;
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    // Récupérer les projets (sites) de l'utilisateur depuis Firestore
    const sitesRef = collection(db, 'users', userId, 'sites');
    const sitesSnap = await getDocs(sitesRef);
    
    const projects: Project[] = [];
    sitesSnap.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        name: data.siteName || data.name || 'Sans nom',
        domain: data.domain || 'Pas de domaine'
      });
    });

    return NextResponse.json({
      projects,
      total: projects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des projets' },
      { status: 500 }
    );
  }
}
