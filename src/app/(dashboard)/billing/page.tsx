
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getInvoices, getUserProfile, UserProfile, Invoice } from "@/lib/firestore-service";
import { format } from "date-fns";
import { FileDown, CreditCard, ShieldCheck, Zap } from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        getUserProfile(user.uid),
        getInvoices(user.uid)
      ]).then(([p, i]) => {
        setProfile(p);
        setInvoices(i);
        setLoading(false);
      });
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
        <p className="text-muted-foreground">Manage your payment methods, plans, and download invoices.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>A list of your recent billing statements.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">Loading invoices...</TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{format(inv.date.toDate(), "MMMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">${inv.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileDown className="mr-2 h-4 w-4" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No invoices found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 fill-current" />
                Current Plan
              </CardTitle>
              <CardDescription className="text-primary-foreground/70">You are currently on the {profile?.plan}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-sm">/mo</span>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> 10 Active Sites</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> 10GB SSD Storage</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Global CDN</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="secondary" className="flex-1 font-bold">Upgrade</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="h-10 w-12 bg-muted rounded flex items-center justify-center font-bold text-xs">VISA</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/26</p>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                Cancel Subscription
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
