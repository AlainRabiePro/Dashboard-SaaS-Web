
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUserProfile, getSites, getInvoices, UserProfile, Site, Invoice } from "@/lib/firestore-service";
import { Globe, HardDrive, Calendar, ArrowUpRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(setProfile);
      getSites(user.uid).then(setSites);
      getInvoices(user.uid).then(setInvoices);
    }
  }, [user]);

  const activeSitesCount = sites.filter(s => s.status === 'active').length;
  const nextInvoice = invoices.length > 0 ? invoices[0] : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || "User"}</h1>
        <p className="text-muted-foreground">Here's what's happening with your account today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSitesCount}</div>
            <p className="text-xs text-muted-foreground">Running on {profile?.plan || "Free Plan"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 GB / {profile?.storageLimit || 10} GB</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-accent" style={{ width: '42%' }}></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Invoice</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">April 1st, 2024</div>
            <p className="text-xs text-muted-foreground">$29.00 estimated amount</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Your current subscription and usage metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">System Health</p>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>

              <div className="p-6 border rounded-lg bg-card">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold">Your Current Plan</h3>
                   <Button size="sm" variant="outline">Manage Plan</Button>
                 </div>
                 <div className="flex items-baseline gap-2">
                   <span className="text-3xl font-bold text-primary">$29</span>
                   <span className="text-muted-foreground">/ month</span>
                 </div>
                 <p className="mt-2 text-sm text-muted-foreground">Your {profile?.plan} includes 10 domains, unlimited SSL and priority support.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest changes across your sites.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Site 'Portfolio Site' was deployed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-accent" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Domain 'blog-me.com' is pending DNS</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Storage alert: 40% usage reached</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Invoice #INV-2024-001 was paid</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
            <Button variant="link" className="w-full mt-4 text-xs">View all activity</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
