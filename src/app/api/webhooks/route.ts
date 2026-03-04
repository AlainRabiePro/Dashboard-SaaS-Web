import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooksRef = collection(db, 'users', userId, 'webhooks');
    const webhooksSnap = await getDocs(webhooksRef);
    
    const webhooks = webhooksSnap.docs.map(doc => ({
      id: doc.id,
      event: (doc.data() as any).event,
      url: (doc.data() as any).url,
      active: ((doc.data() as any).active !== false),
      createdAt: ((doc.data() as any).createdAt?.toDate?.() || new Date()),
      lastTriggered: ((doc.data() as any).lastTriggered?.toDate?.() || null),
    }));

    return NextResponse.json({ webhooks });
  } catch (error: any) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, url } = await request.json();
    if (!event || !url) {
      return NextResponse.json({ error: 'Event and URL are required' }, { status: 400 });
    }

    // Valider URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const webhooksRef = collection(db, 'users', userId, 'webhooks');
    const docRef = await addDoc(webhooksRef, {
      event,
      url,
      active: true,
      createdAt: Timestamp.now(),
      lastTriggered: null,
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      event,
      url,
      active: true,
      createdAt: new Date(),
    });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookId } = await request.json();
    if (!webhookId) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
    }

    const webhookRef = doc(db, 'users', userId, 'webhooks', webhookId);
    await deleteDoc(webhookRef);

    return NextResponse.json({ success: true, message: 'Webhook deleted' });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { webhookId, active } = await request.json();
    if (!webhookId || active === undefined) {
      return NextResponse.json({ error: 'Webhook ID and active status are required' }, { status: 400 });
    }

    const webhookRef = doc(db, 'users', userId, 'webhooks', webhookId);
    await updateDoc(webhookRef, { active });

    return NextResponse.json({ success: true, message: 'Webhook updated' });
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
