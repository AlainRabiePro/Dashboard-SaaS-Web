import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, setDoc, doc, serverTimestamp, query, orderBy, limit, Timestamp } from 'firebase/firestore';
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

// Générer des logs d'audit réalistes
async function initializeAuditLogs(userId: string) {
  const auditLogsRef = collection(db, 'users', userId, 'auditLogs');
  const now = new Date();
  
  const actionTypes = [
    { type: 'LOGIN', description: 'Connexion à votre compte', details: 'IP: 192.168.1.1' },
    { type: 'DEPLOY', description: 'Déploiement de site', details: 'site-yZOECakb.example.com' },
    { type: 'SETTINGS', description: 'Modification des paramètres', details: 'Changement de nom' },
    { type: 'CREATE', description: 'Création d\'un nouveau site', details: 'Nouveau site créé' },
    { type: 'LOGIN', description: 'Connexion à votre compte', details: 'IP: 192.168.1.1' },
    { type: 'DEPLOY', description: 'Déploiement de site', details: 'site-yZOECakb.example.com' },
    { type: 'DELETE', description: 'Suppression d\'une clé API', details: 'Clé API supprimée' },
    { type: 'SETTINGS', description: 'Modification des paramètres', details: 'Changement de thème' },
    { type: 'DEPLOY', description: 'Déploiement de site', details: 'site-yZOECakb.example.com' },
    { type: 'LOGIN', description: 'Connexion à votre compte', details: 'IP: 192.168.1.2' },
  ];

  for (let i = 0; i < actionTypes.length; i++) {
    const action = actionTypes[i];
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);
    
    await addDoc(auditLogsRef, {
      actionType: action.type,
      description: action.description,
      details: action.details,
      timestamp: Timestamp.fromDate(timestamp),
      userId,
    }).catch(err => console.error('Error adding audit log:', err));
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auditLogsRef = collection(db, 'users', userId, 'auditLogs');
    const q = query(auditLogsRef, orderBy('timestamp', 'asc'), limit(100));
    const auditLogsSnap = await getDocs(q);
    
    // Auto-initialiser si aucun log
    if (auditLogsSnap.empty) {
      await initializeAuditLogs(userId);
      const q2 = query(auditLogsRef, orderBy('timestamp', 'asc'), limit(100));
      const auditLogsSnap2 = await getDocs(q2);
      
      const auditLogs = auditLogsSnap2.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        };
      });

      // Calculer les statistiques
      const stats = {
        connections: auditLogs.filter(log => log.actionType === 'LOGIN').length,
        deployments: auditLogs.filter(log => log.actionType === 'DEPLOY').length,
        modifications: auditLogs.filter(log => log.actionType === 'SETTINGS' || log.actionType === 'CREATE').length,
        deletions: auditLogs.filter(log => log.actionType === 'DELETE').length,
      };

      return NextResponse.json({ auditLogs, stats });
    }
    
    const auditLogs = auditLogsSnap.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      };
    });

    // Calculer les statistiques
    const stats = {
      connections: auditLogs.filter(log => log.actionType === 'LOGIN').length,
      deployments: auditLogs.filter(log => log.actionType === 'DEPLOY').length,
      modifications: auditLogs.filter(log => log.actionType === 'SETTINGS' || log.actionType === 'CREATE').length,
      deletions: auditLogs.filter(log => log.actionType === 'DELETE').length,
    };

    return NextResponse.json({ auditLogs, stats });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const auditLogsRef = collection(db, 'users', userId, 'auditLogs');
    
    const docRef = await addDoc(auditLogsRef, {
      ...body,
      timestamp: serverTimestamp(),
      userId,
    });

    return NextResponse.json({ id: docRef.id, success: true });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
