import { ProjectList } from '@/components/dashboard/project-list';
import { MOCK_PROJECTS } from '@/lib/data';

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Your Projects</h1>
      <ProjectList projects={MOCK_PROJECTS} />
    </div>
  );
}
