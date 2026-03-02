'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Project } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { aiProjectConfigurator } from '@/ai/flows/ai-project-configurator';
import { Loader2, Sparkles } from 'lucide-react';

interface CreateProjectDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onProjectCreated: (project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'storageUsed'>) => void;
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  domain: z.string().refine((value) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value), {
    message: 'Please enter a valid domain.',
  }),
  plan: z.enum(['Personal', 'Starter', 'Pro']),
  status: z.enum(['Running', 'Stopped']),
  aiDescription: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateProjectDialog({ isOpen, setIsOpen, onProjectCreated }: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [isAiLoading, setAiLoading] = React.useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      domain: '',
      plan: 'Personal',
      status: 'Running',
      aiDescription: '',
    },
  });

  const onSubmit = (values: FormData) => {
    onProjectCreated(values);
    toast({
      title: 'Project Created',
      description: `Your new project "${values.name}" has been created.`,
    });
    form.reset();
    setIsOpen(false);
  };
  
  const handleAiSuggestion = async () => {
    const description = form.getValues('aiDescription');
    if (!description || description.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Description too short',
        description: 'Please provide a more detailed project description for the AI.',
      });
      return;
    }
    setAiLoading(true);
    try {
      const result = await aiProjectConfigurator({ projectDescription: description });
      form.setValue('plan', result.suggestedHostingPlan);
      toast({
        title: 'AI Suggestion Applied!',
        description: result.recommendationReasoning,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'Could not get AI suggestion. Please try again.',
      });
    } finally {
      setAiLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details for your new project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="aiDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your project (for AI suggestion)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., A high-traffic e-commerce site with a blog." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="button" variant="outline" onClick={handleAiSuggestion} disabled={isAiLoading}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Get AI Plan Suggestion
             </Button>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome App" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="app.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
