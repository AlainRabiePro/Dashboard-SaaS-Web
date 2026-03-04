import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { repo, branch = 'main' } = await request.json();

    if (!repo) {
      return NextResponse.json(
        { error: 'Missing repo (format: owner/repo)' },
        { status: 400 }
      );
    }

    // Try public access first (no auth)
    let response = await fetch(`https://api.github.com/repos/${repo}/commits?sha=${branch}&per_page=20`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Dashboard-SaaS',
      },
    }).catch(() => null);

    // If it fails and we have a token, try with private auth
    if (!response || !response.ok) {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        return NextResponse.json(
          { 
            error: 'Repository not found or is private without authentication',
            commits: [],
            isPrivate: true,
          },
          { status: 404 }
        );
      }

      response = await fetch(`https://api.github.com/repos/${repo}/commits?sha=${branch}&per_page=20`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Dashboard-SaaS',
        },
      });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch commits', commits: [] },
        { status: response.status }
      );
    }

    const commits = await response.json();

    // Format commits
    const formattedCommits = commits.map((commit: any) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0],
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
      avatar: commit.author?.avatar_url,
    }));

    return NextResponse.json({
      success: true,
      repo,
      branch,
      commits: formattedCommits,
      count: formattedCommits.length,
    });

  } catch (error) {
    console.error('[GITHUB-COMMITS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits', details: String(error), commits: [] },
      { status: 500 }
    );
  }
}
