import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
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

async function initializeDomains(userId: string) {
  const domainsRef = collection(db, 'users', userId, 'domains');
  const defaultDomains = [
    {
      name: 'example.com',
      status: 'verified',
      createdAt: new Date(),
      ssl: true,
      pointsTo: 'ns1.example.com',
    },
  ];

  for (const domain of defaultDomains) {
    await addDoc(domainsRef, {
      ...domain,
      createdAt: Timestamp.fromDate(domain.createdAt),
    }).catch(err => console.error('Error adding domain:', err));
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const domainsRef = collection(db, 'users', userId, 'domains');
    const domainsSnap = await getDocs(domainsRef);

    if (domainsSnap.empty) {
      await initializeDomains(userId);
      const domainsSnap2 = await getDocs(domainsRef);
      const domains = domainsSnap2.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any,
        createdAt: (doc.data() as any).createdAt?.toDate?.() || new Date(),
      }));
      return NextResponse.json({ domains });
    }

    const domains = domainsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      createdAt: (doc.data() as any).createdAt?.toDate?.() || new Date(),
    }));

    return NextResponse.json({ domains });
  } catch (error: any) {
    console.error('Error fetching domains:', error);
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
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(name)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    const domainsRef = collection(db, 'users', userId, 'domains');
    const docRef = await addDoc(domainsRef, {
      name,
      status: 'pending',
      createdAt: Timestamp.now(),
      ssl: false,
      pointsTo: null,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Error adding domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domainId } = await request.json();
    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 });
    }

    // Delete the domain document
    const domainRef = doc(db, 'users', userId, 'domains', domainId);
    await deleteDoc(domainRef);

    return NextResponse.json({ success: true, message: 'Domain deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
