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
import { MoreHorizontal, Play, Square, Trash2, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { Project } from '@/lib/types';
import { format } from 'date-fns';
import { CreateProjectDialog } from './create-project-dialog';
import { useAuth } from '../auth/auth-provider';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '../data-provider';

interface ProjectListProps {
  projects: Project[] | undefined;
  loading: boolean;
}

export function ProjectList({ projects, loading }: ProjectListProps) {
  const { user } = useAuth();
  const { subscription } = useData();
  const { toast } = useToast();
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);

  const handleStatusToggle = async (projectId: string, currentStatus: 'Running' | 'Stopped') => {
    if (!user) return;
    const projectRef = doc(db, 'users', user.uid, 'projects', projectId);
    await updateDoc(projectRef, {
      status: currentStatus === 'Running' ? 'Stopped' : 'Running'
    });
    toast({ title: `Project ${currentStatus === 'Running' ? 'stopped' : 'started'}.`})
  };

  const handleDelete = async (projectId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
    toast({ variant: 'destructive', title: 'Project deleted.'})
  };
  
  const handleProjectCreated = async (newProjectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'storageUsed' | 'plan' | 'status'>) => {
    if (!user) return;
    const projectsColRef = collection(db, 'users', user.uid, 'projects');
    await addDoc(projectsColRef, {
        ...newProjectData,
        plan: subscription?.plan || 'Starter',
        status: 'Running',
        storageUsed: 0,
        userId: user.uid,
        createdAt: serverTimestamp(),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Manage your hosted projects.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableRow key={i}>
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
                  projects.map((project) => (
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
                        {project.createdAt && format(project.createdAt.toDate(), 'MMM d, yyyy')}
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
                            No projects found.
                        </TableCell>
                    </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CreateProjectDialog 
        isOpen={isCreateDialogOpen} 
        setIsOpen={setCreateDialogOpen} 
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
