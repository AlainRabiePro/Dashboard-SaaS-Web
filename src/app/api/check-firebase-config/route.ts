import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Firebase Configuration Status',
    config: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Missing',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Configured' : '❌ Missing',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ Configured' : '❌ Missing',
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? '✅ Configured' : '❌ Missing',
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Configured' : '❌ Missing',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Configured' : '❌ Missing',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Configured' : '❌ Missing',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Configured' : '❌ Missing',
    },
    details: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      apiKey: process.env.FIREBASE_API_KEY ? 'Present' : 'Missing',
    }
  });
}
