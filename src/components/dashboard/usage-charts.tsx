'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface UsageChartsProps {
  cpuUsage: number;
  ramUsage: number;
}

const chartData = (cpuUsage: number, ramUsage: number) => [
  { name: 'CPU', usage: cpuUsage, fill: 'var(--color-cpu)' },
  { name: 'RAM', usage: ramUsage, fill: 'var(--color-ram)' },
];

const chartConfig = {
  usage: {
    label: 'Usage (%)',
  },
  cpu: {
    label: 'CPU',
    color: 'hsl(var(--chart-1))',
  },
  ram: {
    label: 'RAM',
    color: 'hsl(var(--chart-2))',
  },
} 

export function UsageCharts({ cpuUsage, ramUsage }: UsageChartsProps) {
  const data = chartData(cpuUsage, ramUsage);

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Resource Usage Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
              width={50}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--card))' }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="usage" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
