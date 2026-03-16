import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

const db = getFirestore(getApp());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { affiliateId, domain, price } = body;

    if (!affiliateId || !domain || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const resellerData = resellerDoc.data();
    const commission = (price * resellerData.commissionRate) / 100;

    // Ajouter la vente
    const salesRef = collection(db, 'resellers', resellerDoc.id, 'sales');
    await addDoc(salesRef, {
      domain,
      price,
      commission,
      date: new Date().toISOString(),
      status: 'pending',
      affiliateId,
    });

    // Mettre à jour les statistiques du revendeur
    await updateDoc(doc(db, 'resellers', resellerDoc.id), {
      totalSales: (resellerData.totalSales || 0) + 1,
      totalRevenue: (resellerData.totalRevenue || 0) + commission,
    });

    return NextResponse.json({
      success: true,
      commission,
      message: 'Sale tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking sale:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
