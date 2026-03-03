'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useData } from '../data-provider';
import { PLANS } from '@/lib/plans';
import { useAuth } from '../auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UpgradePlanDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function UpgradePlanDialog({ isOpen, setIsOpen }: UpgradePlanDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { subscription } = useData();
    const [isLoading, setIsLoading] = React.useState<string | null>(null);
    const currentPlanName = subscription?.plan;

    const handlePlanChange = (plan: typeof PLANS[0]) => {
        if (!user || !subscription || plan.name === currentPlanName) return;
    
        setIsLoading(plan.name);

        const subscriptionRef = doc(db, 'users', user.uid, 'subscription', 'current');
        updateDoc(subscriptionRef, {
          plan: plan.name,
          monthlyCost: plan.price,
          storageLimit: plan.storageLimit,
          cpuCores: plan.cpuCores,
          ram: plan.ram,
        }).catch((error) => {
          console.error('Error updating plan:', error);
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update your plan. Please try again.',
          });
        });
        
        toast({
          title: 'Plan Updated!',
          description: `You are now on the ${plan.name} plan.`,
        });
        setIsLoading(null);
        setIsOpen(false);
      };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-center text-2xl">Choose your plan</DialogTitle>
          </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-0">
            {PLANS.map((plan) => (
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
                    <Button
                        className="w-full"
                        disabled={plan.name === currentPlanName || !!isLoading}
                        onClick={() => handlePlanChange(plan)}
                    >
                        {isLoading === plan.name ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
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
