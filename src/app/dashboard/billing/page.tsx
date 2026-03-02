'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Download } from 'lucide-react';
import { useData } from '@/components/data-provider';
import { PLANS } from '@/lib/plans';
import { UpgradePlanDialog } from '@/components/dashboard/upgrade-plan-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const MOCK_INVOICES = [
    { id: 'INV-003', date: new Date('2024-05-01'), amount: 13.99, status: 'Paid' },
    { id: 'INV-002', date: new Date('2024-04-01'), amount: 13.99, status: 'Paid' },
    { id: 'INV-001', date: new Date('2024-03-01'), amount: 8.99, status: 'Paid' },
];

export default function BillingPage() {
  const { subscription } = useData();
  const [isUpgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const currentPlanDetails = subscription ? PLANS.find(p => p.name === subscription.plan) : null;

  return (
    <>
      <div className="grid gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and view your payment history.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>Your past monthly invoices.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead><span className="sr-only">Download</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_INVOICES.map(invoice => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{format(invoice.date, 'MMM d, yyyy')}</TableCell>
                            <TableCell>€{invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'} className={invoice.status === 'Paid' ? 'bg-green-600/20 text-green-400 border-green-600/30' : ''}>
                                    {invoice.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Button variant="outline" size="icon">
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">Download invoice</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                {subscription ? (
                    <CardDescription>You are on the <span className="font-bold text-primary">{subscription.plan}</span> plan.</CardDescription>
                ) : (
                    <Skeleton className="h-4 w-3/4 mt-1" />
                )}
              </CardHeader>
              <CardContent className="grid gap-6">
                {currentPlanDetails ? (
                    <ul className="space-y-3">
                        {currentPlanDetails.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Skeleton className="h-5 w-5 rounded-full" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                )}
              </CardContent>
              <CardFooter>
                  <Button className="w-full" onClick={() => setUpgradeDialogOpen(true)} disabled={!subscription}>
                    Change Plan
                  </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      <UpgradePlanDialog isOpen={isUpgradeDialogOpen} setIsOpen={setUpgradeDialogOpen} />
    </>
  );
}
