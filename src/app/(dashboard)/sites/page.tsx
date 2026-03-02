
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { getSites, addSite, Site } from "@/lib/firestore-service";
import { ExternalLink, Plus, Settings, Globe, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function SitesPage() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSites();
    }
  }, [user]);

  async function loadSites() {
    setLoading(true);
    try {
      const data = await getSites(user!.uid);
      setSites(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSite() {
    if (!newSiteName || !newSiteUrl) return;
    setIsAdding(true);
    try {
      await addSite(user!.uid, newSiteName, newSiteUrl);
      setNewSiteName("");
      setNewSiteUrl("");
      setIsOpen(false);
      await loadSites();
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Sites</h1>
          <p className="text-muted-foreground">Manage and monitor your deployed applications.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Add New Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
              <DialogDescription>
                Deploy a new application to SaasFlow. Enter the site details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Site Name</label>
                <Input 
                  placeholder="e.g. My Awesome App" 
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Production URL</label>
                <Input 
                  placeholder="https://example.com" 
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSite} disabled={isAdding}>
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Deploy Site
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="overflow-hidden group hover:border-primary transition-colors">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={site.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {site.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Created {format(site.createdAt.toDate(), "MMM dd, yyyy")}
                  </p>
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {site.name}
                </CardTitle>
                <CardDescription className="truncate">{site.url}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                   <span>Framework: Next.js</span>
                   <span>Region: us-east-1</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t p-3 flex justify-between">
                <Button variant="ghost" size="sm" asChild>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Visit
                  </a>
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
              </CardFooter>
            </Card>
          ))}
          {sites.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-muted">
              <p className="text-muted-foreground">No sites found. Deploy your first one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
