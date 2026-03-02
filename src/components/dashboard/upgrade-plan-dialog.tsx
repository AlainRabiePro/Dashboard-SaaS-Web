'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { MOCK_SUBSCRIPTION } from '@/lib/data';

const DIALOG_PLANS = [
  {
    name: 'Free',
    price: 0,
    features: [
      '5 GB SSD Storage',
      'Deploy up to 1 project',
      'Basic Analytics',
      'Community Support',
    ],
  },
  {
    name: 'Starter',
    price: 8.99,
    features: [
      '10 GB SSD Storage',
      'Deploy up to 3 projects',
      'Basic Analytics',
      'Email Support',
    ],
  },
  {
    name: 'Pro',
    price: 13.99,
    features: [
      '50 GB SSD Storage',
      'Deploy unlimited projects',
      'Advanced Analytics',
      'Priority Support',
      'Access to "Deplora" and other tools',
    ],
  },
];

interface UpgradePlanDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function UpgradePlanDialog({ isOpen, setIsOpen }: UpgradePlanDialogProps) {
    const currentPlanName = MOCK_SUBSCRIPTION.plan;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-center text-2xl">Choose your plan</DialogTitle>
          </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 pt-0">
            {DIALOG_PLANS.map((plan) => (
              <Card key={plan.name} className={`flex flex-col ${plan.name === currentPlanName ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  <CardDescription className="text-sm font-semibold tracking-wider uppercase text-primary">{plan.name}</CardDescription>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.price === 0 ? (
                        <span className="text-4xl font-bold">Free</span>
                    ) : (
                        <>
                            <span className="text-4xl font-bold">€{plan.price}</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                        </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 grid gap-6">
                  <div className="h-9"></div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" disabled={plan.name === currentPlanName}>
                        {plan.name === currentPlanName ? 'Current Plan' : 'Upgrade'}
                    </Button>
                </CardFooter>
              </Card>
            ))}
            </div>
        </DialogContent>
        </Dialog>
    );
}
