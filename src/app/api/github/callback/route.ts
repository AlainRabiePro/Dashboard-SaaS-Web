import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebase } from "@/firebase";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { encryptToken } from "@/lib/encryption";
import { extractUserFromRequest } from "@/lib/auth-middleware";

// Initialiser Firebase Admin
let adminAuth: any;
try {
  initializeFirebase();
  adminAuth = getAuth();
} catch (error) {
  console.log("Firebase already initialized");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    // Vérifier les erreurs de GitHub
    if (error) {
      console.error(`GitHub OAuth Error: ${error} - ${error_description}`);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings?github_error=${encodeURIComponent(error_description || error)}`
      );
    }

    // Vérifier que le code est présent
    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings?github_error=Pas de code d'autorisation reçu`
      );
    }

    // Vérifier le state pour la sécurité
    // (Ce vérification appelle côté client, ici c'est juste une vérification basique)
    if (!state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings?github_error=State invalide`
      );
    }

    // Échanger le code pour un token d'accès
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GitHub OAuth configuration missing");
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings?github_error=Configuration GitHub manquante`
      );
    }

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: `${request.nextUrl.origin}/api/github/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Failed to obtain GitHub access token:", tokenData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings?github_error=Impossible d'obtenir le token d'accès`
      );
    }

    // Récupérer les informations utilisateur GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Accept": "application/json",
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.login) {
      console.error("Failed to get GitHub user info:", githubUser);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings?github_error=Impossible de récupérer les informations utilisateur`
      );
    }

    // Extraire l'utilisateur actuel depuis le contexte d'authentification
    let userId: string | null = null;
    
    // Essayer d'obtenir l'utilisateur depuis les cookies de session Firebase
    try {
      const sessionCookie = request.cookies.get('__session')?.value;
      if (sessionCookie) {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedToken.uid;
      }
    } catch (error) {
      console.log("Session cookie not available");
    }

    // Fallback: essayer depuis l'en-tête Authorization
    if (!userId) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decodedToken = await adminAuth.verifyIdToken(token);
          userId = decodedToken.uid;
        } catch (error) {
          console.log("Invalid auth header");
        }
      }
    }

    // Si on peut sauvegarder, sauvegarder le token dans Firestore
    if (userId && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      try {
        // Construction manuelle de l'URL Firestore pour utiliser Firestore REST API
        const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const encryptedToken = encryptToken(tokenData.access_token);
        
        const updatePayload = {
          github: {
            username: githubUser.login,
            accessToken: encryptedToken,
            connectedAt: new Date().toISOString(),
            id: githubUser.id,
            avatar: githubUser.avatar_url,
            publicRepos: githubUser.public_repos,
          },
          updatedAt: new Date().toISOString(),
        };

        // Utiliser Firestore REST API
        const response = await fetch(
          `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/users/${userId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenData.access_token}`, // Utilise le token d'accès du serveur
            },
            body: JSON.stringify({
              fields: {
                github: {
                  mapValue: {
                    fields: {
                      username: { stringValue: githubUser.login },
                      accessToken: { stringValue: encryptedToken },
                      connectedAt: { timestampValue: new Date().toISOString() },
                      id: { integerValue: githubUser.id.toString() },
                      avatar: { stringValue: githubUser.avatar_url },
                      publicRepos: { integerValue: githubUser.public_repos.toString() },
                    },
                  },
                },
                updatedAt: { timestampValue: new Date().toISOString() },
              },
            }),
          }
        );

        if (!response.ok) {
          console.error('Failed to save GitHub token to Firestore:', response.statusText);
        } else {
          console.log('GitHub token saved successfully');
        }
      } catch (error) {
        console.error('Error saving GitHub token:', error);
        // Continue even if saving fails
      }
    }

    // Rediriger vers la page de settings avec succès
    const redirectUrl = new URL("/settings", request.nextUrl.origin);
    redirectUrl.searchParams.set("github_connected", "true");
    redirectUrl.searchParams.set("github_username", githubUser.login);

    const response = NextResponse.redirect(redirectUrl);
    
    // Stocker le username dans un cookie pour l'afficher
    response.cookies.set({
      name: "github_username",
      value: githubUser.login,
      httpOnly: false,
      maxAge: 3600 * 24 * 30, // 30 jours
    });

    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?github_error=Erreur lors de la connexion GitHub`
    );
  }
}
