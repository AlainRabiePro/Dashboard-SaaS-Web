import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';

export async function extractUserFromRequest(request: NextRequest): Promise<{ uid: string; email: string } | null> {
  try {
    // Récupérer le token des cookies
    const token = request.cookies.get('__session')?.value;
    
    if (!token) {
      return null;
    }

    const auth = getAuth();
    const decodedToken = await auth.verifySessionCookie(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch (error) {
    console.error('Failed to extract user from request:', error);
    return null;
  }
}

export async function extractUserFromAuthHeader(authHeader?: string): Promise<{ uid: string; email: string } | null> {
  try {
    // Format: "Bearer token"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch (error) {
    console.error('Failed to extract user from auth header:', error);
    return null;
  }
}
