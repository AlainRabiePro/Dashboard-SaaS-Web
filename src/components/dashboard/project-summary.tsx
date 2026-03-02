'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectSummaryProps {
  projects: Project[] | undefined;
}

export function ProjectSummary({ projects }: ProjectSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>A summary of your most recent projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {projects !== undefined ? (
             projects.length > 0 ? (
                projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between gap-4">
                    <div className="grid gap-1">
                      <p className="font-medium leading-none">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.domain}</p>
                    </div>
                    <Badge variant={project.status === 'Running' ? 'default' : 'secondary'} className={`whitespace-nowrap ${project.status === 'Running' ? 'bg-green-600/20 text-green-400 border-green-600/30' : ''}`}>
                      {project.status}
                    </Badge>
                  </li>
                ))
             ) : (
                <li className="text-center text-muted-foreground">No projects yet.</li>
             )
          ) : (
            [...Array(3)].map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-4">
                <div className="grid gap-1 w-full">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </li>
            ))
          )}
        </ul>
      </CardContent>
      <CardFooter>
        <Link href="/dashboard/projects" className="w-full">
          <Button variant="outline" className="w-full justify-between">
            View All Projects
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
