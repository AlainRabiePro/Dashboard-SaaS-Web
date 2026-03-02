'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_SUBSCRIPTION } from '@/lib/data';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    storage: 5,
    features: [
      '5 GB SSD Storage',
      'Deploy up to 1 project',
      'Basic Analytics',
      'Community Support',
    ],
    hasToolAccess: false,
  },
  {
    name: 'Starter',
    price: 8.99,
    storage: 10,
    features: [
      '10 GB SSD Storage',
      'Deploy up to 3 projects',
      'Basic Analytics',
      'Email Support',
    ],
    hasToolAccess: false,
  },
  {
    name: 'Pro',
    price: 13.99,
    storage: 50,
    features: [
      '50 GB SSD Storage',
      'Deploy unlimited projects',
      'Advanced Analytics',
      'Priority Support',
      'Access to "Deplora" and other tools',
    ],
    hasToolAccess: true,
  },
];

export default function BillingPage() {
  const currentPlanName = MOCK_SUBSCRIPTION.plan;

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
                <Button className="w-full" disabled={plan.name === currentPlanName}>
                    {plan.name === currentPlanName ? 'Current Plan' : 'Select Plan'}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
