'use client';

import { StatCard } from '@/components/dashboard/stat-card';
import { UsageCharts } from '@/components/dashboard/usage-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, HardDrive, Cpu, MemoryStick, ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';
import { ProjectSummary } from '@/components/dashboard/project-summary';
import { useState } from 'react';
import { UpgradePlanDialog } from '@/components/dashboard/upgrade-plan-dialog';
import { useData } from '@/components/data-provider';

export default function DashboardPage() {
  const { projects, subscription, usage } = useData();
  const [isUpgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  if (!subscription || !usage) {
    return null; 
  }

  const totalProjects = projects.length;
  const storagePercentage = (usage.storage / subscription.storageLimit) * 100;
  const recentProjects = projects.slice(0, 3);

  return (
    <>
      <div className="grid gap-4 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <StatCard title="Total Projects" value={totalProjects} icon={HardDrive} />
          <StatCard title="CPU Usage" value={`${usage.cpu}%`} icon={Cpu} />
          <StatCard title="RAM Usage" value={`${usage.ram}%`} icon={MemoryStick} />
          <StatCard title="Monthly Cost" value={`€${subscription.monthlyCost.toFixed(2)}`} icon={DollarSign} description="Estimated" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-7">
          <UsageCharts cpuUsage={usage.cpu} ramUsage={usage.ram} />
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan is <span className="font-bold text-primary">{subscription.plan}</span>.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <div className="mb-2 flex justify-between items-baseline">
                  <p className="text-sm font-medium text-muted-foreground">Storage Usage</p>
                  <p className="text-sm font-bold">{`${usage.storage.toFixed(1)} GB / ${subscription.storageLimit} GB`}</p>
                </div>
                <Progress value={storagePercentage} aria-label={`${storagePercentage.toFixed(0)}% storage used`} />
              </div>
              <div className="text-sm text-muted-foreground">
                  <p>CPU Cores: {subscription.cpuCores}</p>
                  <p>RAM: {subscription.ram} GB</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => setUpgradeDialogOpen(true)}>Upgrade Plan</Button>
            </CardFooter>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
          <ProjectSummary projects={recentProjects} />
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">AI Performance Assistant</CardTitle>
                <Bot className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Get personalized recommendations to optimize your server's performance and reduce costs.</p>
            </CardContent>
            <CardFooter>
                <Link href="/dashboard/assistant" className="w-full">
                    <Button variant="ghost" className="w-full justify-between hover:bg-primary/20">
                        Get AI Recommendations
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
      <UpgradePlanDialog isOpen={isUpgradeDialogOpen} setIsOpen={setUpgradeDialogOpen} />
    </>
  );
}
