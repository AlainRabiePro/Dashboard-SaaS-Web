'use client';

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useData } from '../data-provider';
import { useMemo } from 'react';

// Mock historical data for the chart
const generateChartData = (cpuUsage: number, ramUsage: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = new Date().getDay();
    
    // Create a week of data ending today
    const orderedDays = [...days.slice(todayIndex + 1), ...days.slice(0, todayIndex + 1)];
    
    return orderedDays.map((day, i) => {
        // Create a trend where usage is generally lower at the beginning of the week
        const trendFactor = 1 - (orderedDays.length - 1 - i) * 0.03;
        // Add some randomness
        const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
        const baseCpu = cpuUsage * trendFactor * randomFactor;
        const baseRam = ramUsage * trendFactor * randomFactor;

        return {
            day,
            cpu: Math.max(5, Math.min(95, Math.round(baseCpu))),
            ram: Math.max(5, Math.min(95, Math.round(baseRam))),
        }
    });
};

const chartConfig = {
  cpu: {
    label: 'CPU',
    color: 'hsl(var(--chart-1))',
  },
  ram: {
    label: 'RAM',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function UsageCharts() {
  const { usage } = useData();

  const chartData = useMemo(() => {
    if (!usage) return [];
    const data = generateChartData(usage.cpu, usage.ram);
    // Ensure the last data point (today) is the actual current usage
    if (data.length > 0) {
      data[data.length - 1].cpu = usage.cpu;
      data[data.length - 1].ram = usage.ram;
    }
    return data;
  }, [usage]);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
        <CardDescription>An overview of your resource usage for the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <ChartTooltip
              cursor={{
                stroke: 'hsl(var(--border))',
                strokeWidth: 2,
                strokeDasharray: '3 3',
              }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="cpu"
              type="monotone"
              stroke="var(--color-cpu)"
              strokeWidth={2.5}
              dot={true}
            />
            <Line
              dataKey="ram"
              type="monotone"
              stroke="var(--color-ram)"
              strokeWidth={2.5}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
