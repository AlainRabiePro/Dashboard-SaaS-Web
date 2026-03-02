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

export default function DashboardPage() {
  const { projects, subscription, usage } = useData();
  const [isUpgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const totalProjects = projects?.length;
  const storagePercentage = (usage && subscription) ? (usage.storage / subscription.storageLimit) * 100 : 0;
  const recentProjects = projects?.slice(0, 3);

  return (
    <>
      <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {projects !== undefined ? (
            <StatCard title="Total Projects" value={totalProjects!} icon={HardDrive} />
          ) : (
            <Skeleton className="h-[126px]" />
          )}

          {usage !== undefined ? (
            <StatCard title="CPU Usage" value={`${usage.cpu}%`} icon={Cpu} description="Current" />
          ) : (
            <Skeleton className="h-[126px]" />
          )}
          
          {usage !== undefined ? (
            <StatCard title="RAM Usage" value={`${usage.ram}%`} icon={MemoryStick} description="Current" />
          ) : (
            <Skeleton className="h-[126px]" />
          )}
          
          {subscription !== undefined ? (
            <StatCard title="Monthly Cost" value={`€${subscription.monthlyCost.toFixed(2)}`} icon={DollarSign} description="Estimated" />
          ) : (
            <Skeleton className="h-[126px]" />
          )}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
            {usage !== undefined ? (
                <UsageCharts />
            ) : (
                <Skeleton className="lg:col-span-2 h-[410px]" />
            )}
          
            <div className="lg:col-span-1 flex flex-col gap-8">
                <ProjectSummary projects={recentProjects} />
                <Card>
                    <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                    {subscription ? (
                        <CardDescription>Your current plan is <span className="font-bold text-primary">{subscription.plan}</span>.</CardDescription>
                    ) : (
                        <Skeleton className="h-4 w-3/4 mt-1" />
                    )}
                    </CardHeader>
                    <CardContent className="grid gap-4">
                    {subscription && usage ? (
                        <div>
                        <div className="mb-2 flex justify-between items-baseline">
                            <p className="text-sm font-medium text-muted-foreground">Storage Usage</p>
                            <p className="text-sm font-bold">{`${usage.storage.toFixed(1)} GB / ${subscription.storageLimit} GB`}</p>
                        </div>
                        <Progress value={storagePercentage} aria-label={`${storagePercentage.toFixed(0)}% storage used`} />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="mb-2 flex justify-between items-baseline">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                        </div>
                    )}
                    {subscription ? (
                        <div className="text-sm text-muted-foreground mt-2">
                            <p>CPU Cores: {subscription.cpuCores}</p>
                            <p>RAM: {subscription.ram} GB</p>
                        </div>
                    ) : (
                        <div className="space-y-2 mt-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        </div>
                    )}
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
