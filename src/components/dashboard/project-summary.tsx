'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/types';
import { ArrowRight, Circle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
        <div className="space-y-4">
          {projects !== undefined ? (
             projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-4">
                    <div className="grid gap-1">
                      <p className="font-semibold leading-none">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.domain}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Circle className={cn('h-2 w-2', project.status === 'Running' ? 'fill-green-500 text-green-500' : 'fill-gray-500 text-gray-500')} />
                        <span className="text-sm text-muted-foreground">{project.status}</span>
                    </div>
                  </div>
                ))
             ) : (
                <div className="text-center text-muted-foreground py-4">No projects yet.</div>
             )
          ) : (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="grid gap-1 w-full">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/dashboard/projects" className="w-full">
          <Button variant="outline" className="w-full">
            View All Projects
            <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
