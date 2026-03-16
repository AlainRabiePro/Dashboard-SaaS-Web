import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const db = getFirestore(getApp());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateId, source = 'Direct' } = body;

    if (!affiliateId) {
      return NextResponse.json(
        { error: 'Affiliate ID required' },
        { status: 400 }
      );
    }

    // Chercher le revendeur par affiliateId
    const resellersRef = collection(db, 'resellers');
    const q = query(resellersRef, where('affiliateId', '==', affiliateId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Reseller not found' },
        { status: 404 }
      );
    }

    const resellerDoc = snapshot.docs[0];

    // Ajouter le clic
    const clicksRef = collection(db, 'resellers', resellerDoc.id, 'clicks');
    await addDoc(clicksRef, {
      timestamp: new Date(),
      source,
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referrer: request.headers.get('referer'),
      affiliateId,
    });

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
