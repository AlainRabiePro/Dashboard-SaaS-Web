'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Download } from 'lucide-react';
import { useData } from '@/components/data-provider';
import { useAuth } from '@/components/auth/auth-provider';
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

type Invoice = typeof MOCK_INVOICES[0];

export default function BillingPage() {
  const { subscription } = useData();
  const { user } = useAuth();
  const [isUpgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const currentPlanDetails = subscription ? PLANS.find(p => p.name === subscription.plan) : null;

  const handleDownloadInvoice = (invoice: Invoice) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ServerSphere', margin, 30);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', pageWidth - margin, 30, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);

    // Company & Client info
    doc.setFontSize(11);
    doc.text('ServerSphere Inc.', margin, 50);
    doc.text('123 Cloud Ave, Webville', margin, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', pageWidth - margin - 70, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(user?.email || 'N/A', pageWidth - margin, 50, { align: 'right' });


    // Invoice Details
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', margin, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.id, margin + 40, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', margin, 77);
    doc.setFont('helvetica', 'normal');
    doc.text(format(invoice.date, 'MMM d, yyyy'), margin + 40, 77);
    
    // Table Header
    const tableY = 95;
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, tableY);
    doc.text('Amount', pageWidth - margin, tableY, { align: 'right' });
    doc.line(margin, tableY + 5, pageWidth - margin, tableY + 5);

    // Table Body
    const itemY = tableY + 15;
    doc.setFont('helvetica', 'normal');
    const planName = subscription?.plan || 'Plan';
    doc.text(`${planName} Plan - Subscription`, margin, itemY);
    doc.text(`€${invoice.amount.toFixed(2)}`, pageWidth - margin, itemY, { align: 'right' });
    
    // Table Footer
    const totalY = itemY + 20;
    doc.line(margin, totalY - 5, pageWidth - margin, totalY - 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Total', margin, totalY + 5);
    doc.text(`€${invoice.amount.toFixed(2)}`, pageWidth - margin, totalY + 5, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for your business!', margin, footerY);
    doc.text('Questions? Contact support@serversphere.com', margin, footerY + 5);

    doc.save(`Invoice-${invoice.id}.pdf`);
  };

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
                                <Button variant="outline" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
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
