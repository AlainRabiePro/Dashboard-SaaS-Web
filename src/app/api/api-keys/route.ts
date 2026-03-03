import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { randomBytes } from 'crypto';
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

async function initializeApiKeys(userId: string) {
  const keysRef = collection(db, 'users', userId, 'apiKeys');
  const defaultKey = 'sk_' + randomBytes(16).toString('hex');
  
  await addDoc(keysRef, {
    name: 'Default Key',
    key: defaultKey,
    createdAt: Timestamp.now(),
    lastUsed: null,
  }).catch(err => console.error('Error initializing API key:', err));
}

function generateKey(): string {
  return 'sk_' + randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keysRef = collection(db, 'users', userId, 'apiKeys');
    const keysSnap = await getDocs(keysRef);
    
    if (keysSnap.empty) {
      await initializeApiKeys(userId);
      const keysSnap2 = await getDocs(keysRef);
      const keys = keysSnap2.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any,
        key: `${((doc.data() as any).key || '').substring(0, 10)}••••••••••••••`,
        createdAt: ((doc.data() as any).createdAt?.toDate?.() || new Date()),
      }));
      return NextResponse.json({ keys });
    }
    
    const keys = keysSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      key: `${((doc.data() as any).key || '').substring(0, 10)}••••••••••••••`,
      createdAt: ((doc.data() as any).createdAt?.toDate?.() || new Date()),
    }));

    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newKey = generateKey();
    const keysRef = collection(db, 'users', userId, 'apiKeys');
    const docRef = await addDoc(keysRef, {
      name,
      key: newKey,
      createdAt: Timestamp.now(),
      lastUsed: null,
    });

    return NextResponse.json({ success: true, id: docRef.id, key: newKey });
  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
