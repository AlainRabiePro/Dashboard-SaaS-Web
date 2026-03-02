'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-provider';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { PLANS } from '@/lib/plans';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    if (!isFirebaseConfigured) {
        toast({
          variant: 'destructive',
          title: 'Firebase Not Configured',
          description: "Please add your Firebase project's web app configuration to the .env file.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await signUp(auth, values.email, values.password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.email?.split('@')[0] || 'New User',
      });

      const starterPlan = PLANS.find(p => p.name === 'Starter');
      if (!starterPlan) {
        throw new Error('Starter plan definition not found.');
      }

      // Create default subscription
      const subscriptionRef = doc(db, 'users', user.uid, 'subscription', 'current');
      await setDoc(subscriptionRef, {
        plan: starterPlan.name,
        monthlyCost: starterPlan.price,
        storageLimit: starterPlan.storageLimit,
        cpuCores: starterPlan.cpuCores,
        ram: starterPlan.ram,
      });

      // Create default usage stats
      const usageRef = doc(db, 'users', user.uid, 'usage', 'current');
      await setDoc(usageRef, {
        cpu: 15,
        ram: 25,
        storage: 1.2,
      });
      
      // Create a sample project
      const projectsColRef = collection(db, 'users', user.uid, 'projects');
      await addDoc(projectsColRef, {
        name: 'My First Project',
        domain: 'example.com',
        storageUsed: 1.2,
        status: 'Running',
        plan: 'Starter',
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Success',
        description: 'Account created successfully. Welcome!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'There was a problem with your request.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
