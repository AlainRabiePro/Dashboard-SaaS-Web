"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, GitCommit, AlertCircle, ExternalLink } from "lucide-react";
import { useGithubCommits } from "@/hooks/use-github-commits";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CommitsListProps {
  repoUrl?: string;
  branch?: string;
  title?: string;
  maxCommits?: number;
}

export function CommitsList({ 
  repoUrl, 
  branch = 'main',
  title = 'Commits récents',
  maxCommits = 10
}: CommitsListProps) {
  const { commits, loading, error, isPrivate } = useGithubCommits(repoUrl, branch);
  const displayCommits = commits.slice(0, maxCommits);

  if (!repoUrl) {
    return null;
  }

  return (
    <Card className="border-white/5 bg-zinc-950/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-amber-500" />
            <CardTitle>{title}</CardTitle>
          </div>
          {isPrivate && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-300">
              Private Repo
            </Badge>
          )}
        </div>
        <CardDescription>Nouveaux commits du repository</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{error}</p>
              {isPrivate && (
                <p className="text-xs mt-1">Configurez GITHUB_TOKEN pour les repos privés.</p>
              )}
            </div>
          </div>
        ) : displayCommits.length > 0 ? (
          <div className="space-y-2">
            {displayCommits.map((commit) => (
              <a
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-md border border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {commit.avatar && (
                    <img
                      src={commit.avatar}
                      alt={commit.author}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-blue-400">{commit.sha}</p>
                    <p className="text-sm font-medium truncate mt-1">{commit.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{commit.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(commit.date), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Aucun commit trouvé</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
