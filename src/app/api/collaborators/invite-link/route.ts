import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import crypto from 'crypto';
import { getMaxInvitations } from '@/lib/subscription-service';

const { firestore: db } = initializeFirebase();

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const projectId = req.headers.get('x-project-id');

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'Missing userId or projectId' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const plan = userData.subscription?.plan || 'free';
    const activeAddOns = userData.subscription?.activeAddOns || [];

    // Vérifier si l'utilisateur peut inviter des collaborateurs
    const maxInvitations = getMaxInvitations(plan as any, activeAddOns);
    if (maxInvitations === 0) {
      return NextResponse.json(
        { 
          error: 'Not authorized',
          message: 'You need to subscribe to the Team Collaborators add-on to invite team members',
          requiresAddon: true,
          addonId: 'collaborators',
          addonPrice: 2, // 2€ par mois
        },
        { status: 403 }
      );
    }

    // Récupérer le projet
    const siteRef = doc(db, 'users', userId, 'sites', projectId);
    const siteDoc = await getDoc(siteRef);

    if (!siteDoc.exists()) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const siteData = siteDoc.data();

    // Récupérer les collaborateurs actuels
    const collaboratorsRef = doc(db, 'users', userId, 'sites', projectId, 'collaborators', 'list');
    const collaboratorsDoc = await getDoc(collaboratorsRef);
    const currentCollaborators = collaboratorsDoc.data()?.list || [];
    const acceptedCount = currentCollaborators.filter((c: any) => c.status === 'active').length;

    // Vérifier que le lien n'existe pas déjà ou l'utiliser s'il existe
    const inviteLinksRef = doc(db, 'users', userId, 'sites', projectId, 'inviteLinks', 'active');
    const inviteLinksDoc = await getDoc(inviteLinksRef);

    let invitationToken: string;
    let createdAt: Date;

    if (inviteLinksDoc.exists()) {
      // Réutiliser le lien existant
      const existingLink = inviteLinksDoc.data();
      invitationToken = existingLink.token;
      createdAt = existingLink.createdAt.toDate();
    } else {
      // Générer un nouveau lien
      invitationToken = crypto.randomBytes(32).toString('hex');
      createdAt = new Date();

      // Stocker le lien dans Firestore (privé et public)
      await setDoc(inviteLinksRef, {
        token: invitationToken,
        siteId: projectId,
        siteName: siteData.name,
        ownerId: userId,
        createdAt: Timestamp.fromDate(createdAt),
        updatedAt: Timestamp.fromDate(new Date()),
        acceptanceCount: 0,
        maxAcceptances: maxInvitations,
      });

      // Stocker aussi dans la collection publique pour les acceptations
      const publicInviteRef = doc(db, 'publicInvitations', invitationToken);
      await setDoc(publicInviteRef, {
        token: invitationToken,
        siteId: projectId,
        siteName: siteData.name,
        ownerId: userId,
        createdAt: Timestamp.fromDate(createdAt),
        updatedAt: Timestamp.fromDate(new Date()),
        acceptanceCount: 0,
        maxAcceptances: maxInvitations,
      });
    }

    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}&projectId=${projectId}`;

    return NextResponse.json({
      success: true,
      link: invitationLink,
      token: invitationToken,
      limit: maxInvitations,
      used: acceptedCount,
      remaining: Math.max(0, maxInvitations - acceptedCount),
      createdAt: createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error generating invite link:', error);
    return NextResponse.json(
      { error: 'Failed to generate invitation link' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const projectId = req.headers.get('x-project-id');

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'Missing userId or projectId' },
        { status: 400 }
      );
    }

    // Récupérer le lien d'invitation
    const inviteLinksRef = doc(db, 'users', userId, 'sites', projectId, 'inviteLinks', 'active');
    const inviteLinksDoc = await getDoc(inviteLinksRef);

    if (!inviteLinksDoc.exists()) {
      return NextResponse.json(
        { error: 'No invitation link found' },
        { status: 404 }
      );
    }

    const linkData = inviteLinksDoc.data();
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${linkData.token}&projectId=${projectId}`;

    return NextResponse.json({
      success: true,
      link: invitationLink,
      token: linkData.token,
      limit: linkData.maxAcceptances,
      used: linkData.acceptanceCount,
      remaining: Math.max(0, linkData.maxAcceptances - linkData.acceptanceCount),
      createdAt: linkData.createdAt.toDate().toISOString(),
      isExpired: linkData.acceptanceCount >= linkData.maxAcceptances,
    });
  } catch (error) {
    console.error('Error fetching invite link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation link' },
      { status: 500 }
    );
  }
}
