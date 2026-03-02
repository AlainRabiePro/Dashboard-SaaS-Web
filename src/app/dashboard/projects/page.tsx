'use client';
import * as React from 'react';
import { ProjectList } from '@/components/dashboard/project-list';
import { useData } from '@/components/data-provider';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog';
import { useAuth } from '@/components/auth/auth-provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ProjectsPage() {
  const { projects, loading, subscription } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);

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
    toast({
      title: 'Project Created',
      description: `Your new project "${newProjectData.name}" has been created.`,
    });
  };

  return (
    <>
      <div className="grid gap-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                <p className="text-muted-foreground">Manage your hosted projects.</p>
            </div>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
            </Button>
        </div>
        <ProjectList projects={projects} loading={loading} />
      </div>
      <CreateProjectDialog 
        isOpen={isCreateDialogOpen} 
        setIsOpen={setCreateDialogOpen} 
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
