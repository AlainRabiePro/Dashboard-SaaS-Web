import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface CacheStats {
  size: number;
  itemsCount: number;
  lastCleared: number;
  enabled: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const siteId = request.nextUrl.searchParams.get('siteId');
    console.log('📡 [CACHE] GET request - user:', userId, 'site:', siteId);

    if (!userId) {
      console.log('❌ [CACHE] No user ID provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer les stats du cache
    const docRef = doc(db, 'users', userId, 'cache_stats', siteId || 'global');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as CacheStats;
      console.log('✅ [CACHE] Retrieved cache stats from Firestore', {
        userId,
        siteId: siteId || 'global',
        size: `${data.size}KB`,
        itemsCount: data.itemsCount,
        lastCleared: new Date(data.lastCleared).toISOString(),
        path: `users/${userId}/cache_stats/${siteId || 'global'}`
      });
      return NextResponse.json(data);
    }

    console.log('ℹ️ [CACHE] No cache stats found, returning empty defaults');
    return NextResponse.json({
      size: 0,
      itemsCount: 0,
      lastCleared: Date.now(),
      enabled: true,
    } as CacheStats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const siteId = request.nextUrl.searchParams.get('siteId');
    console.log('🗑️ [CACHE] DELETE request - clearing cache for user:', userId, 'site:', siteId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Vider le cache
    const cacheStats: CacheStats = {
      size: 0,
      itemsCount: 0,
      lastCleared: Date.now(),
      enabled: true,
    };

    const docRef = doc(db, 'users', userId, 'cache_stats', siteId || 'global');
    const timestamp = Date.now();
    await setDoc(docRef, cacheStats);

    console.log('✅ [CACHE] Successfully cleared', {
      userId,
      siteId: siteId || 'global',
      timestamp: new Date(timestamp).toISOString(),
      path: `users/${userId}/cache_stats/${siteId || 'global'}`,
      newSize: 0,
      newItemsCount: 0
    });
    return NextResponse.json({
      success: true,
      message: 'Cache vidé avec succès',
      timestamp,
      cleared: true,
      size: 0,
      itemsCount: 0
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { enabled, siteId } = await request.json();

    // Mettre à jour les paramètres du cache
    const docRef = doc(db, 'users', userId, 'cache_config', siteId || 'global');
    await setDoc(docRef, {
      enabled,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Cache ${enabled ? 'activé' : 'désactivé'}`,
    });
  } catch (error) {
    console.error('Error updating cache settings:', error);
    return NextResponse.json(
      { error: 'Failed to update cache settings' },
      { status: 500 }
    );
  }
}
