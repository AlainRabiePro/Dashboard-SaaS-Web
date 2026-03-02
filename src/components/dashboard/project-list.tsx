'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, Square, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { Project } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '../auth/auth-provider';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectListProps {
  projects: Project[] | undefined;
  loading: boolean;
}

export function ProjectList({ projects, loading }: ProjectListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleStatusToggle = (projectId: string, currentStatus: 'Running' | 'Stopped') => {
    if (!user) return;
    const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
    
    updateDoc(projectRef, {
      status: currentStatus === 'Running' ? 'Stopped' : 'Running'
    }).catch((error) => {
        console.error('Error updating project status:', error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update the project status.',
        });
    });

    toast({ title: `Project ${currentStatus === 'Running' ? 'stopped' : 'started'}.`})
  };

  const handleDelete = (projectId: string) => {
    if (!user) return;

    deleteDoc(doc(db, 'users', user.uid, 'projects', projectId)).catch((error) => {
        console.error('Error deleting project:', error);
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the project.',
        });
    });

    toast({ variant: 'destructive', title: 'Project deleted.'})
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Storage</TableHead>
              <TableHead className="hidden md:table-cell">Created At</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
            ) : (
              projects && projects.length > 0 ? (
                projects.filter(p => p && p.id).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.domain}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status === 'Running' ? 'default' : 'secondary'} className={project.status === 'Running' ? 'bg-green-600/20 text-green-400 border-green-600/30' : ''}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{project.storageUsed.toFixed(1)} GB</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {project.createdAt?.toDate ? format(project.createdAt.toDate(), 'MMM d, yyyy') : 'Pending...'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusToggle(project.id, project.status)}>
                            {project.status === 'Running' ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            <span>{project.status === 'Running' ? 'Stop' : 'Start'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(project.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                  <TableRow key="no-projects">
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No projects found. Click "New Project" to get started.
                      </TableCell>
                  </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
