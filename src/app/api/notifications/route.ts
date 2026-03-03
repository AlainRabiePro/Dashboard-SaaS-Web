import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
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

// Générer des notifications réalistes
async function initializeNotifications(userId: string) {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const now = new Date();
  
  const notificationsList = [
    { title: 'Déploiement réussi', description: 'Site site-yZOECakb.example.com déployé avec succès', type: 'success', channel: 'email' },
    { title: 'Erreur de déploiement', description: 'Échec du déploiement sur zone-123', type: 'error', channel: 'sms' },
    { title: 'Mise à jour disponible', description: 'Une nouvelle version est disponible', type: 'info', channel: 'email' },
    { title: 'Clé API créée', description: 'Nouvelle clé API générée avec succès', type: 'success', channel: 'email' },
    { title: 'Utilisation quota', description: 'Vous avez utilisé 80% de votre quota mensuel', type: 'warning', channel: 'sms' },
    { title: 'Certificat SSL', description: 'Votre certificat SSL expire dans 7 jours', type: 'warning', channel: 'email' },
    { title: 'Accès collaborateur', description: 'user@example.com a accès à votre compte', type: 'info', channel: 'email' },
    { title: 'Sauvegarde complétée', description: 'Sauvegarde automatique terminée', type: 'success', channel: 'email' },
  ];

  for (let i = 0; i < notificationsList.length; i++) {
    const notification = notificationsList[i];
    const daysAgo = Math.floor(Math.random() * 10);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);
    
    await addDoc(notificationsRef, {
      ...notification,
      timestamp: Timestamp.fromDate(timestamp),
      read: Math.random() > 0.3,
      userId,
    }).catch(err => console.error('Error adding notification:', err));
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));
    const notificationsSnap = await getDocs(q);
    
    // Auto-initialiser si aucune notification
    if (notificationsSnap.empty) {
      await initializeNotifications(userId);
      const q2 = query(notificationsRef, orderBy('timestamp', 'desc'), limit(50));
      const notificationsSnap2 = await getDocs(q2);
      
      const notifications = notificationsSnap2.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        };
      });

      // Récupérer les préférences
      const prefsRef = doc(db, 'users', userId, 'settings', 'notificationPreferences');
      const prefsSnap = await getDocs(collection(db, 'users', userId, 'settings')).then(snap => {
        const prefDoc = snap.docs.find(d => d.id === 'notificationPreferences');
        return prefDoc?.data() || { email: '', phone: '', emailEnabled: false, smsEnabled: false };
      });

      return NextResponse.json({ notifications, preferences: prefsSnap });
    }
    
    const notifications = notificationsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      };
    });

    // Récupérer les préférences
    const settingsRef = collection(db, 'users', userId, 'settings');
    const settingsSnap = await getDocs(settingsRef);
    const prefsDoc = settingsSnap.docs.find(d => d.id === 'notificationPreferences');
    const preferences = prefsDoc?.data() || { email: '', phone: '', emailEnabled: false, smsEnabled: false };

    return NextResponse.json({ notifications, preferences });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Endpoint pour mettre à jour les préférences
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, phone, emailEnabled, smsEnabled } = await request.json();
    
    const prefsRef = doc(db, 'users', userId, 'settings', 'notificationPreferences');
    await setDoc(prefsRef, {
      email: email || '',
      phone: phone || '',
      emailEnabled: emailEnabled ?? false,
      smsEnabled: smsEnabled ?? false,
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: 'Préférences mises à jour' });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

