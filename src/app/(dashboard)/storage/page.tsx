
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getUserProfile, getSites, UserProfile, Site } from "@/lib/firestore-service";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HardDrive, AlertTriangle, TrendingUp } from "lucide-react";

export default function StoragePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
      getSites(user.uid).then(setSites);
    }
  }, [user]);

  const usedStorage = 4.2; // Mock usage
  const totalStorage = profile?.storageLimit || 10;
  const usagePercentage = (usedStorage / totalStorage) * 100;

  // Mock data for breakdown
  const chartData = [
    { name: 'Portfolio', value: 2.1 },
    { name: 'Personal Blog', value: 1.5 },
    { name: 'Internal Wiki', value: 0.6 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Storage Usage</h1>
        <p className="text-muted-foreground">Monitor and scale your asset and database storage.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Global Overview
            </CardTitle>
            <CardDescription>Your aggregate storage consumption across all projects.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold">{usedStorage} GB</span>
                <span className="text-muted-foreground text-sm">of {totalStorage} GB limit</span>
              </div>
              <Progress value={usagePercentage} className="h-4" />
              <p className="text-xs text-muted-foreground">You are using {usagePercentage.toFixed(1)}% of your available storage.</p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Running out of space?</p>
                  <p className="text-xs text-muted-foreground">Upgrade your plan to get up to 100 GB of high-speed storage and advanced caching.</p>
                </div>
              </div>
              <Button className="w-full font-bold">Upgrade Storage</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Breakdown by Site
            </CardTitle>
            <CardDescription>Storage usage per individual application (GB).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
