
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, HardDrive, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile, Site, Invoice } from "@/lib/firestore-service";

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const profileRef = useMemo(() => user ? doc(firestore, "users", user.uid) : null, [firestore, user]);
  const sitesRef = useMemo(() => user ? collection(firestore, "users", user.uid, "sites") : null, [firestore, user]);
  const invoicesQuery = useMemo(() => user ? query(collection(firestore, "users", user.uid, "invoices"), orderBy("date", "desc"), limit(1)) : null, [firestore, user]);

  const { data: profile } = useDoc<UserProfile>(profileRef);
  const { data: sites } = useCollection<Site>(sitesRef);
  const { data: recentInvoices } = useCollection<Invoice>(invoicesQuery);

  const activeSitesCount = sites.filter(s => s.status === 'active').length;
  const storageLimit = profile?.storageLimit || 10;
  const storageUsed = 4.2; // Mocked for now

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || user?.email?.split('@')[0] || "User"}</h1>
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
            <div className="text-2xl font-bold">{storageUsed} GB / {storageLimit} GB</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${(storageUsed / storageLimit) * 100}%` }}></div>
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
            </div>
            <Button variant="link" className="w-full mt-4 text-xs">View all activity</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
