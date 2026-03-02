'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { MOCK_PROJECTS, MOCK_SUBSCRIPTION, MOCK_USAGE } from '@/lib/data';
import {
  aiPerformanceAssistantRecommendations,
  AiPerformanceAssistantRecommendationsOutput,
} from '@/ai/flows/ai-performance-assistant-recommendations';

export default function AssistantPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<AiPerformanceAssistantRecommendationsOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      const input = {
        cpuUsage: MOCK_USAGE.cpu,
        ramUsage: MOCK_USAGE.ram,
        storageUsageGB: MOCK_USAGE.storage,
        currentPlan: MOCK_SUBSCRIPTION.plan,
        projects: MOCK_PROJECTS.map(p => ({
            name: p.name,
            domain: p.domain,
            storageUsedGB: p.storageUsed,
            status: p.status
        }))
      };
      const result = await aiPerformanceAssistantRecommendations(input);
      setRecommendations(result);
    } catch (e) {
      console.error(e);
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Performance Assistant</h1>
        <p className="text-muted-foreground">Analyze your server usage and get personalized recommendations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
          <CardDescription>Click the button below to start the AI analysis of your current server setup.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetRecommendations} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze Performance
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50">
          <CardHeader className="flex-row gap-4 items-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Analysis Failed</CardTitle>
              <CardDescription className="text-destructive/80">{error}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {recommendations && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{recommendations.summary}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {recommendations.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="flex-row items-center gap-4">
              <Info className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <CardTitle>Potential Cost Savings</CardTitle>
                <p className="text-2xl font-bold text-primary">{recommendations.costSavingsEstimate}</p>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
