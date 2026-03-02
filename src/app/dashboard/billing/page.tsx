'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useData } from '@/components/data-provider';
import { PLANS } from '@/lib/plans';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React from 'react';

export default function BillingPage() {
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
  };

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and choose the best plan for your needs.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.name === currentPlanName ? 'border-primary ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-baseline gap-2">
                {plan.price === 0 ? (
                    <span className="text-4xl font-bold">Free</span>
                ) : (
                    <>
                        <span className="text-4xl font-bold">€{plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                    </>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
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
                    {plan.name === currentPlanName ? 'Current Plan' : 'Select Plan'}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
