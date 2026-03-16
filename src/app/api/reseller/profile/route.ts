import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

const db = getFirestore(getApp());
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Chercher le profil revendeur
    const resellersRef = collection(db, 'resellers');
    const q = query(resellersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Reseller profile not found' },
        { status: 404 }
      );
    }

    const profile = snapshot.docs[0].data();
    
    // Chercher les ventes récentes
    const salesRef = collection(db, 'resellers', snapshot.docs[0].id, 'sales');
    const salesSnapshot = await getDocs(salesRef);
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    return NextResponse.json({
      profile: {
        id: snapshot.docs[0].id,
        ...profile,
      },
      sales: sales.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 50),
    });
  } catch (error) {
    console.error('Error fetching reseller profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Vérifier s'il existe déjà un profil
    const resellersRef = collection(db, 'resellers');
    const q = query(resellersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: 'Reseller profile already exists' },
        { status: 409 }
      );
    }

    // Créer un nouveau profil revendeur
    const affiliateId = nanoid(10);
    const newProfile = {
      userId,
      status: 'active' as const,
      commissionRate: 90, // 90% commission au revendeur (toi tu gardes 10%)
      totalSales: 0,
      totalRevenue: 0,
      affiliateLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://dashboard-saas.com'}?ref=${affiliateId}`,
      affiliateId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(resellersRef, newProfile);

    return NextResponse.json({
      profile: {
        id: docRef.id,
        ...newProfile,
      },
      sales: [],
    });
  } catch (error) {
    console.error('Error creating reseller profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
