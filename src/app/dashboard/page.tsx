import { StatCard } from '@/components/dashboard/stat-card';
import { UsageCharts } from '@/components/dashboard/usage-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MOCK_PROJECTS, MOCK_SUBSCRIPTION, MOCK_USAGE } from '@/lib/data';
import { DollarSign, HardDrive, Cpu, MemoryStick, ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';
import { ProjectSummary } from '@/components/dashboard/project-summary';

export default function DashboardPage() {
  const totalProjects = MOCK_PROJECTS.length;
  const storagePercentage = (MOCK_USAGE.storage / MOCK_SUBSCRIPTION.storageLimit) * 100;
  const recentProjects = MOCK_PROJECTS.slice(0, 3);

  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard title="Total Projects" value={totalProjects} icon={HardDrive} />
        <StatCard title="CPU Usage" value={`${MOCK_USAGE.cpu}%`} icon={Cpu} />
        <StatCard title="RAM Usage" value={`${MOCK_USAGE.ram}%`} icon={MemoryStick} />
        <StatCard title="Monthly Cost" value={`$${MOCK_SUBSCRIPTION.monthlyCost}`} icon={DollarSign} description="Estimated" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-7">
        <UsageCharts cpuUsage={MOCK_USAGE.cpu} ramUsage={MOCK_USAGE.ram} />
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan is <span className="font-bold text-primary">{MOCK_SUBSCRIPTION.plan}</span>.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <div className="mb-2 flex justify-between items-baseline">
                <p className="text-sm font-medium text-muted-foreground">Storage Usage</p>
                <p className="text-sm font-bold">{`${MOCK_USAGE.storage.toFixed(1)} GB / ${MOCK_SUBSCRIPTION.storageLimit} GB`}</p>
              </div>
              <Progress value={storagePercentage} aria-label={`${storagePercentage.toFixed(0)}% storage used`} />
            </div>
            <div className="text-sm text-muted-foreground">
                <p>CPU Cores: {MOCK_SUBSCRIPTION.cpuCores}</p>
                <p>RAM: {MOCK_SUBSCRIPTION.ram} GB</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Upgrade Plan</Button>
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
  );
}
