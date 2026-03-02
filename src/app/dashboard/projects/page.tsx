'use client';
import { ProjectList } from '@/components/dashboard/project-list';
import { useData } from '@/components/data-provider';

export default function ProjectsPage() {
  const { projects, loading } = useData();
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Your Projects</h1>
      <ProjectList projects={projects} loading={loading} />
    </div>
  );
}
