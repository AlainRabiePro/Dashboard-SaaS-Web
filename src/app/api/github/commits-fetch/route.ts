import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/encryption';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebase } from '@/firebase';

try {
  initializeFirebase();
} catch (error) {
  console.log("Firebase already initialized");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repo parameters are required' },
        { status: 400 }
      );
    }

    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Récupérer le token GitHub de l'utilisateur depuis Firestore
    // Pour maintenant, utiliser un token public (limité en rate limit)
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      // Si pas de token d'accès personnel, utiliser l'API publique
      return fetchPublicCommits(owner, repo);
    }

    // Utiliser le token pour plus de rate limit
    return fetchCommitsWithToken(owner, repo, githubToken);
  } catch (error) {
    console.error('Error in GitHub commits endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function fetchPublicCommits(owner: string, repo: string) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    const formattedCommits = commits.map((commit: any) => ({
      id: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      date: formatTimeAgo(new Date(commit.commit.author?.date || commit.commit.committer?.date)),
      author: commit.commit.author?.name || 'Unknown',
      authorAvatar: commit.author?.avatar_url,
      url: commit.html_url,
    }));

    return NextResponse.json({
      commits: formattedCommits,
      isPrivate: false,
    });
  } catch (error) {
    console.error('Error fetching public commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits', commits: [] },
      { status: 200 } // Return 200 avec commits vides
    );
  }
}

async function fetchCommitsWithToken(owner: string, repo: string, token: string) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      // Si le repo est privé et pas d'authentification
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or private', commits: [], isPrivate: true },
          { status: 200 }
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();

    const formattedCommits = commits.map((commit: any) => ({
      id: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      date: formatTimeAgo(new Date(commit.commit.author?.date || commit.commit.committer?.date)),
      author: commit.commit.author?.name || 'Unknown',
      authorAvatar: commit.author?.avatar_url,
      url: commit.html_url,
    }));

    return NextResponse.json({
      commits: formattedCommits,
      isPrivate: false,
    });
  } catch (error) {
    console.error('Error fetching commits with token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits', commits: [] },
      { status: 200 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}m`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR');
}
