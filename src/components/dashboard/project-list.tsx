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

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects: initialProjects }: ProjectListProps) {
  const [projects, setProjects] = React.useState(initialProjects);
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);

  const handleStatusToggle = (projectId: string) => {
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? { ...p, status: p.status === 'Running' ? 'Stopped' : 'Running' }
          : p
      )
    );
  };

  const handleDelete = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId));
  };
  
  const handleProjectCreated = (newProject: Omit<Project, 'id' | 'userId' | 'createdAt'>) => {
    const projectToAdd: Project = {
        ...newProject,
        id: `proj-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'user-123',
        createdAt: new Date(),
    };
    setProjects([projectToAdd, ...projects]);
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
              {projects.map((project) => (
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
                    {format(project.createdAt, 'MMM d, yyyy')}
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
                        <DropdownMenuItem onClick={() => handleStatusToggle(project.id)}>
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
              ))}
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
