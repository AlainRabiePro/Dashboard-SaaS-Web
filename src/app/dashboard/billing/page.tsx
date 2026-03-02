import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_SUBSCRIPTION, MOCK_USAGE } from '@/lib/data';

const PLAN_DETAILS = {
  Starter: { cpu: '2 Cores', ram: '4GB RAM', storage: '50GB SSD' },
  Pro: { cpu: '4 Cores', ram: '8GB RAM', storage: '100GB SSD' },
  Business: { cpu: '8 Cores', ram: '16GB RAM', storage: '200GB SSD' },
};

export default function BillingPage() {
  const currentPlanDetails = PLAN_DETAILS[MOCK_SUBSCRIPTION.plan];

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your plan and payment details.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are currently on the <span className="font-bold text-primary">{MOCK_SUBSCRIPTION.plan}</span> plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-card p-4">
              <div>
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="font-semibold">{currentPlanDetails.cpu}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RAM</p>
                <p className="font-semibold">{currentPlanDetails.ram}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="font-semibold">{currentPlanDetails.storage}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="font-semibold">{MOCK_USAGE.cpu}%</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">RAM Usage</p>
                <p className="font-semibold">{MOCK_USAGE.ram}%</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="font-semibold">{MOCK_USAGE.storage.toFixed(1)} GB</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button>Upgrade Plan</Button>
            <Button variant="destructive-outline">Cancel Subscription</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimated Cost</CardTitle>
            <CardDescription>Your estimated cost for the current billing cycle.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold tracking-tighter">${MOCK_SUBSCRIPTION.monthlyCost.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">per month</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Payment History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

declare module '@/components/ui/button' {
    interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
      variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
        | 'destructive-outline';
    }
  }
  
  import { cva } from 'class-variance-authority';
  
  const originalButtonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline",
          'destructive-outline': "border border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
        },
        size: {
          default: "h-10 px-4 py-2",
          sm: "h-9 rounded-md px-3",
          lg: "h-11 rounded-md px-8",
          icon: "h-10 w-10",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    }
  );
  
  // This is a bit of a hack to add a new variant to the button
  // A better solution would be to modify the original file or use composition.
  // @ts-ignore
  Button.variants = originalButtonVariants;
