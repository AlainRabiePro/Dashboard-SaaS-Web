import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

export default function ToolsPage() {
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        <p className="text-muted-foreground">A collection of useful tools and utilities for your projects.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            We're working on adding more tools. Check back later!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center gap-4 h-64">
            <Terminal className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">No tools available yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
