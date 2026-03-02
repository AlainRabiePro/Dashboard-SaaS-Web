
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDomains, Domain } from "@/lib/firestore-service";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DomainsPage() {
  const { user } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getDomains(user.uid).then((data) => {
        setDomains(data);
        setLoading(false);
      });
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'propagated':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Propagated</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-600"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Domain Names</h1>
        <p className="text-muted-foreground">Manage your custom domains and DNS configurations.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search domains..." className="pl-8" />
        </div>
        <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Refresh DNS Status</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain Name</TableHead>
                <TableHead>Linked Site</TableHead>
                <TableHead>DNS Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="h-24 text-center">Loading domains...</TableCell>
                 </TableRow>
              ) : (
                domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-semibold">{domain.domain}</TableCell>
                    <TableCell>{domain.linkedSite}</TableCell>
                    <TableCell>{getStatusBadge(domain.dnsStatus)}</TableCell>
                    <TableCell>{format(domain.expiryDate.toDate(), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Manage DNS</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && domains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No domains found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
