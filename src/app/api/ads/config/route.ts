import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface AdsConfig {
  publisherId: string;
  enabled: boolean;
  adSlots: Array<{
    slotId: string;
    name: string;
    dimensions: string;
    type: 'display' | 'responsive' | 'native';
    location: string;
  }>;
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    adSenseApproved: boolean;
    lastUpdated: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('📡 [ADS CONFIG] GET request from user:', userId);
    
    if (!userId) {
      console.log('❌ [ADS CONFIG] No user ID provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const docRef = doc(db, 'users', userId, 'ads_config', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('✅ [ADS CONFIG] Returning saved config');
      return NextResponse.json(docSnap.data());
    }

    // Retourner une config par défaut
    console.log('ℹ️ [ADS CONFIG] No config found, returning default');
    return NextResponse.json({
      publisherId: '',
      enabled: false,
      adSlots: [],
      settings: {
        autoRefresh: true,
        refreshInterval: 60000,
        adSenseApproved: false,
        lastUpdated: Date.now(),
      },
    });
  } catch (error) {
    console.error('Error fetching ads config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    console.log('📡 [ADS CONFIG] POST request from user:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as AdsConfig;
    console.log('📝 [ADS CONFIG] Saving config:', body.publisherId);

    // Valider le Publisher ID
    if (body.publisherId && !body.publisherId.startsWith('ca-pub-')) {
      console.log('❌ [ADS CONFIG] Invalid publisher ID format');
      return NextResponse.json(
        { error: 'Invalid publisher ID format' },
        { status: 400 }
      );
    }

    // Sauvegarder dans Firestore
    const docRef = doc(db, 'users', userId, 'ads_config', 'main');
    const timestamp = Date.now();
    await setDoc(docRef, {
      ...body,
      settings: {
        ...body.settings,
        lastUpdated: timestamp,
      },
    });

    console.log('✅ [ADS CONFIG] Successfully saved to Firestore', {
      userId,
      publisherId: body.publisherId,
      enabled: body.enabled,
      timestamp: new Date(timestamp).toISOString(),
      path: `users/${userId}/ads_config/main`
    });
    return NextResponse.json({
      success: true,
      message: 'Configuration AdSense mise à jour',
      config: body,
    });
  } catch (error) {
    console.error('Error saving ads config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slotId } = await request.json();

    const docRef = doc(db, 'users', userId, 'ads_config', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as AdsConfig;
      data.adSlots = data.adSlots.filter(slot => slot.slotId !== slotId);
      await setDoc(docRef, data);
    }

    return NextResponse.json({
      success: true,
      message: 'Ad slot supprimé',
    });
  } catch (error) {
    console.error('Error deleting ad slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete ad slot' },
      { status: 500 }
    );
  }
}
