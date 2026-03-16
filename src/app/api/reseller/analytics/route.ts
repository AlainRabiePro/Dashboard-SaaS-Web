import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const db = getFirestore(getApp());

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const period = request.nextUrl.searchParams.get('period') || '7'; // 7, 30, 90 days
    
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

    const resellerId = snapshot.docs[0].id;
    const researchDate = new Date();
    researchDate.setDate(researchDate.getDate() - parseInt(period));

    // Récupérer les clics
    const clicksRef = collection(db, 'resellers', resellerId, 'clicks');
    const clicksQuery = query(
      clicksRef,
      where('timestamp', '>=', Timestamp.fromDate(researchDate))
    );
    const clicksSnapshot = await getDocs(clicksQuery);
    const clicks = clicksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Récupérer les ventes
    const salesRef = collection(db, 'resellers', resellerId, 'sales');
    const salesQuery = query(
      salesRef,
      where('date', '>=', researchDate.toISOString())
    );
    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Calculer les métriques
    const totalClicks = clicks.length;
    const totalConversions = sales.length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : '0';
    const totalRevenue = sales.reduce((sum, s) => sum + (s.commission || 0), 0);

    // Regrouper par jour pour graphique
    const dailyData: Record<string, any> = {};
    clicks.forEach((click: any) => {
      const date = new Date(click.timestamp?.toDate?.() || click.timestamp).toLocaleDateString('fr-FR');
      if (!dailyData[date]) {
        dailyData[date] = { date, clicks: 0, conversions: 0, revenue: 0 };
      }
      dailyData[date].clicks++;
    });

    sales.forEach((sale: any) => {
      const date = new Date(sale.date).toLocaleDateString('fr-FR');
      if (!dailyData[date]) {
        dailyData[date] = { date, clicks: 0, conversions: 0, revenue: 0 };
      }
      dailyData[date].conversions++;
      dailyData[date].revenue += sale.commission || 0;
    });

    const chartData = Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Sources de trafic
    const trafficSources: Record<string, number> = {};
    clicks.forEach((click: any) => {
      const source = click.source || 'Direct';
      trafficSources[source] = (trafficSources[source] || 0) + 1;
    });

    // Domaines populaires
    const domainExtensions: Record<string, number> = {};
    sales.forEach((sale: any) => {
      const domain = sale.domain || 'unknown';
      const ext = domain.split('.').pop() || 'unknown';
      domainExtensions[ext] = (domainExtensions[ext] || 0) + 1;
    });

    // Top performers
    const topDays = chartData.sort((a: any, b: any) => b.conversions - a.conversions).slice(0, 5);

    return NextResponse.json({
      period,
      metrics: {
        totalClicks,
        totalConversions,
        conversionRate: parseFloat(conversionRate),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        avgRevenuePerSale: totalConversions > 0 ? parseFloat((totalRevenue / totalConversions).toFixed(2)) : 0,
      },
      chartData,
      trafficSources: Object.entries(trafficSources).map(([source, count]) => ({
        source,
        count,
        percentage: ((count / totalClicks) * 100).toFixed(1),
      })),
      domainExtensions: Object.entries(domainExtensions)
        .map(([ext, count]) => ({
          extension: `.${ext}`,
          count,
          percentage: ((count / totalConversions) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count),
      topDays,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as any).message },
      { status: 500 }
    );
  }
}
