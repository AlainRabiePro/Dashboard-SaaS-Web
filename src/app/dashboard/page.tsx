'use client';

import { StatCard } from '@/components/dashboard/stat-card';
import { UsageCharts } from '@/components/dashboard/usage-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, HardDrive, Cpu, MemoryStick } from 'lucide-react';
import { ProjectSummary } from '@/components/dashboard/project-summary';
import { useState } from 'react';
import { UpgradePlanDialog } from '@/components/dashboard/upgrade-plan-dialog';
import { useData } from '@/components/data-provider';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardSkeleton = () => (
    <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
            <Skeleton className="h-[126px]" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-[410px]" />
            <div className="lg:col-span-1 flex flex-col gap-8">
                <Skeleton className="h-[280px]" />
                <Skeleton className="h-[260px]" />
            </div>
        </div>
    </div>
);


export default function DashboardPage() {
  const { projects, subscription, usage, loading } = useData();
  const [isUpgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const totalProjects = projects?.length ?? 0;
  const storagePercentage = (usage && subscription) ? (usage.storage / subscription.storageLimit) * 100 : 0;
  const recentProjects = projects?.slice(0, 3);

  return (
    <>
      <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <StatCard title="Total Projects" value={totalProjects} icon={HardDrive} />
            <StatCard title="CPU Usage" value={usage ? `${usage.cpu}%` : 'N/A'} icon={Cpu} description="Current" />
            <StatCard title="RAM Usage" value={usage ? `${usage.ram}%` : 'N/A'} icon={MemoryStick} description="Current" />
            <StatCard title="Monthly Cost" value={subscription ? `€${subscription.monthlyCost.toFixed(2)}` : 'N/A'} icon={DollarSign} description="Estimated" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
            <UsageCharts />
          
            <div className="lg:col-span-1 flex flex-col gap-8">
                <ProjectSummary projects={recentProjects} />
                <Card>
                    <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                        <CardDescription>Your current plan is <span className="font-bold text-primary">{subscription?.plan || 'N/A'}</span>.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                    
                        <div>
                        <div className="mb-2 flex justify-between items-baseline">
                            <p className="text-sm font-medium text-muted-foreground">Storage Usage</p>
                            <p className="text-sm font-bold">{usage && subscription ? `${usage.storage.toFixed(1)} GB / ${subscription.storageLimit} GB` : 'N/A'}</p>
                        </div>
                        <Progress value={storagePercentage} aria-label={`${storagePercentage.toFixed(0)}% storage used`} />
                        </div>
                    
                        <div className="text-sm text-muted-foreground mt-2">
                            <p>CPU Cores: {subscription?.cpuCores ?? 'N/A'}</p>
                            <p>RAM: {subscription?.ram ?? 'N/A'} GB</p>
                        </div>
                    
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full" onClick={() => setUpgradeDialogOpen(true)} disabled={!subscription}>Change Plan</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </div>
      <UpgradePlanDialog isOpen={isUpgradeDialogOpen} setIsOpen={setUpgradeDialogOpen} />
    </>
  );
}
