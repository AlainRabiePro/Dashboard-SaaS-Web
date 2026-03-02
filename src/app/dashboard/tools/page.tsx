'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Rocket, History, Settings2, Lock } from 'lucide-react';
import Link from 'next/link';
import { MOCK_SUBSCRIPTION } from '@/lib/data';
import { Button } from '@/components/ui/button';

const tools = [
  {
    title: 'Deplora',
    description: 'Deploy a new site or update an existing one from a repository.',
    icon: Rocket,
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Version History',
    description: 'Browse and restore previous versions of your deployed sites.',
    icon: History,
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Ad Integration',
    description: 'Easily integrate advertising platforms into your projects.',
    icon: Newspaper,
    href: '#',
    comingSoon: true,
  },
  {
    title: 'Manage Ads',
    description: 'Configure and manage ad campaigns and placements.',
    icon: Settings2,
    href: '#',
    comingSoon: true,
  },
];

export default function ToolsPage() {
  const hasAccess = MOCK_SUBSCRIPTION.plan === 'Pro';

  if (!hasAccess) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 h-full text-center p-8">
            <Lock className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-2xl font-bold">Tools Are a Pro Feature</h1>
            <p className="text-muted-foreground max-w-md mt-2 mb-6">
              Please upgrade to the Pro plan to get access to Deplora, version history, and other powerful tools.
            </p>
            <Link href="/dashboard/billing">
              <Button>Upgrade Your Plan</Button>
            </Link>
        </div>
    );
  }
  
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
        <p className="text-muted-foreground">A collection of useful tools and utilities for your projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.title} className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className="flex-row items-center gap-4">
              <tool.icon className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">{tool.description}</p>
            </CardContent>
            <div className="p-6 pt-0">
                {tool.comingSoon ? (
                    <div className="text-xs font-semibold text-primary/80">Coming Soon</div>
                ) : (
                    <Link href={tool.href} className="text-sm font-semibold text-primary hover:underline">
                        Launch Tool
                    </Link>
                )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
