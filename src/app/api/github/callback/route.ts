import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebase } from "@/firebase";

// Initialiser Firebase Admin
try {
  initializeFirebase();
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

    // TODO: Sauvegarder le token d'accès GitHub dans la base de données Firestore
    // Pour l'utilisateur actuel (vous devez avoir l'ID utilisateur du contexte)
    // Exemple:
    // await updateDoc(doc(firestore, 'users', userId), {
    //   github: {
    //     username: githubUser.login,
    //     accessToken: encrypt(tokenData.access_token), // Chiffrer si possible
    //     connectedAt: new Date(),
    //   }
    // });

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
