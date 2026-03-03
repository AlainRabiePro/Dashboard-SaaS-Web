import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
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

async function initializeTeam(userId: string) {
  const teamRef = collection(db, 'users', userId, 'team');
  const members = [
    { name: 'Alain Rabie', email: 'alain.rabie.pro@gmail.com', role: 'owner', status: 'active', joinedAt: new Date() },
  ];
  
  for (const member of members) {
    await addDoc(teamRef, {
      ...member,
      joinedAt: Timestamp.fromDate(member.joinedAt),
    }).catch(err => console.error('Error adding team member:', err));
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamRef = collection(db, 'users', userId, 'team');
    const teamSnap = await getDocs(teamRef);
    
    if (teamSnap.empty) {
      await initializeTeam(userId);
      const teamSnap2 = await getDocs(teamRef);
      const members = teamSnap2.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any,
        joinedAt: (doc.data() as any).joinedAt?.toDate?.() || new Date(),
      }));
      return NextResponse.json({ members });
    }
    
    const members = teamSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as any,
      joinedAt: (doc.data() as any).joinedAt?.toDate?.() || new Date(),
    }));

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, role } = await request.json();
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const teamRef = collection(db, 'users', userId, 'team');
    const docRef = await addDoc(teamRef, {
      name,
      email,
      role,
      status: 'pending',
      joinedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
