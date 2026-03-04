import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import {
  generateInvitationToken,
  generateInvitationExpiry,
  validateEmail,
  type Collaborator,
} from '@/lib/collaborator-service';

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

/**
 * Enregistre une action dans l'audit log
 */
async function logAuditAction(
  userId: string,
  action: string,
  description: string,
  email?: string,
  request?: NextRequest
) {
  try {
    const auditRef = collection(db, 'users', userId, 'audit_logs');
    await setDoc(doc(auditRef), {
      action,
      title: description,
      description,
      timestamp: Date.now(),
      resourceId: email,
      resourceType: 'collaborator',
      ip: request?.headers?.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      userAgent: request?.headers?.get('user-agent') || 'unknown',
    });
  } catch (error) {
    console.error('⚠️ Erreur lors de la création du log audit:', error);
    // Ne pas bloquer l'opération si l'audit log échoue
  }
}

/**
 * GET - Récupère tous les collaborateurs
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collaboratorsRef = collection(db, 'users', userId, 'collaborators');
    const collaboratorsSnap = await getDocs(collaboratorsRef);

    const collaborators: Collaborator[] = collaboratorsSnap.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role || 'reader',
        status: data.status || 'active',
        invitedAt: data.invitedAt,
        acceptedAt: data.acceptedAt,
      };
    });

    return NextResponse.json({ collaborators });
  } catch (error: any) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Crée ou invite un collaborateur
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Missing email or role' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!['owner', 'admin', 'editor', 'reader'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const collaboratorsRef = collection(db, 'users', userId, 'collaborators');

    // Vérifier si le collaborateur existe déjà
    const existingDocs = await getDocs(collaboratorsRef);
    const existing = existingDocs.docs.find(doc => {
      const data = doc.data() as any;
      return data.email === email;
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Collaborator already exists' },
        { status: 409 }
      );
    }

    // Créer le collaborateur
    const invitationToken = generateInvitationToken();
    const invitationExpiresAt = generateInvitationExpiry();

    const collaboratorData = {
      email,
      name: name || email.split('@')[0],
      role,
      status: 'invited' as const,
      invitedAt: Date.now(),
      invitationToken,
      invitationExpiresAt,
    };

    const docRef = doc(collaboratorsRef);
    await setDoc(docRef, collaboratorData);

    // 🎯 Enregistrer l'action dans l'audit log
    await logAuditAction(
      userId,
      'INVITE_COLLABORATOR',
      `Invitation envoyée à ${email}`,
      email,
      request
    );

    // TODO: Envoyer l'email d'invitation
    // await sendInvitationEmail(email, invitationToken);

    return NextResponse.json({
      success: true,
      collaborator: {
        id: docRef.id,
        ...collaboratorData,
        invitationToken,
        invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`,
      },
    });
  } catch (error: any) {
    console.error('Error creating collaborator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH - Met à jour le rôle d'un collaborateur
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collaboratorId, role } = await request.json();

    if (!collaboratorId || !role) {
      return NextResponse.json(
        { error: 'Missing collaboratorId or role' },
        { status: 400 }
      );
    }

    if (!['owner', 'admin', 'editor', 'reader'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const collaboratorRef = doc(
      db,
      'users',
      userId,
      'collaborators',
      collaboratorId
    );

    await setDoc(
      collaboratorRef,
      { role },
      { merge: true }
    );

    // 🎯 Enregistrer l'action dans l'audit log
    await logAuditAction(
      userId,
      'PERMISSIONS_CHANGE',
      `Permissions modifiées: nouveau rôle ${role}`,
      collaboratorId,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Collaborator role updated',
    });
  } catch (error: any) {
    console.error('Error updating collaborator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Supprime un collaborateur
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collaboratorId } = await request.json();

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'Missing collaboratorId' },
        { status: 400 }
      );
    }

    const collaboratorRef = doc(
      db,
      'users',
      userId,
      'collaborators',
      collaboratorId
    );

    await deleteDoc(collaboratorRef);

    // 🎯 Enregistrer l'action dans l'audit log
    await logAuditAction(
      userId,
      'DELETE',
      `Suppression d'un collaborateur`,
      collaboratorId,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Collaborator removed',
    });
  } catch (error: any) {
    console.error('Error deleting collaborator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
