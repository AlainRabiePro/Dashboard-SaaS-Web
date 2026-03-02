'use server';
/**
 * @fileOverview An AI Performance Assistant that analyzes server usage and project configurations
 *               to provide personalized recommendations for resource optimization and cost efficiency.
 *
 * - aiPerformanceAssistantRecommendations - The main function to get AI-driven performance recommendations.
 * - AiPerformanceAssistantRecommendationsInput - The input type for the recommendations function.
 * - AiPerformanceAssistantRecommendationsOutput - The return type for the recommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiPerformanceAssistantRecommendationsInputSchema = z.object({
  cpuUsage: z.number().describe('Current CPU usage percentage (0-100).'),
  ramUsage: z.number().describe('Current RAM usage percentage (0-100).'),
  storageUsageGB: z.number().describe('Total storage used in GB.'),
  currentPlan: z.string().describe('The user\'s current subscription plan (e.g., Starter, Pro, Business).'),
  projects: z.array(
    z.object({
      name: z.string().describe('Project name.'),
      domain: z.string().describe('Project domain.'),
      storageUsedGB: z.number().describe('Storage used by this project in GB.'),
      status: z.enum(['Running', 'Stopped']).describe('Current status of the project.'),
    })
  ).describe('A list of all hosted projects and their configurations.'),
});
export type AiPerformanceAssistantRecommendationsInput = z.infer<typeof AiPerformanceAssistantRecommendationsInputSchema>;

const AiPerformanceAssistantRecommendationsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the performance assistant\'s findings and overall recommendations.'),
  recommendations: z.array(z.string()).describe('A list of specific, actionable recommendations for resource optimization and cost efficiency.'),
  costSavingsEstimate: z.string().describe('An estimated potential monthly cost saving (e.g., "$10/month" or "N/A" if not quantifiable).'),
});
export type AiPerformanceAssistantRecommendationsOutput = z.infer<typeof AiPerformanceAssistantRecommendationsOutputSchema>;

export async function aiPerformanceAssistantRecommendations(input: AiPerformanceAssistantRecommendationsInput): Promise<AiPerformanceAssistantRecommendationsOutput> {
  return aiPerformanceAssistantRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPerformanceAssistantRecommendationsPrompt',
  input: {schema: AiPerformanceAssistantRecommendationsInputSchema},
  output: {schema: AiPerformanceAssistantRecommendationsOutputSchema},
  prompt: `You are an AI Performance Assistant for ServerSphere, an expert in VPS hosting management and cloud resource optimization. Your goal is to analyze the user's current server usage patterns and project configurations, then provide personalized, actionable recommendations to optimize resource allocation and improve cost efficiency.

Analyze the following data:

Current Overall Usage:
- CPU Usage: {{{cpuUsage}}}%
- RAM Usage: {{{ramUsage}}}%
- Total Storage Used: {{{storageUsageGB}}} GB
- Current Subscription Plan: {{{currentPlan}}}

Projects Hosted:
{{#if projects}}
{{#each projects}}
- Project Name: {{{name}}}, Domain: {{{domain}}}, Storage Used: {{{storageUsedGB}}} GB, Status: {{{status}}}
{{/each}}
{{else}}
No projects currently hosted.
{{/if}}

Based on this information, provide:
1. A concise summary of your findings and overall recommendations.
2. A list of specific, actionable recommendations.
3. An estimated potential monthly cost saving, if quantifiable, otherwise state 'N/A'.

Focus on identifying:
- Underutilized resources that can be scaled down.
- Overutilized resources that may require an upgrade or redistribution.
- Opportunities to stop inactive projects.
- Suggestions for optimizing storage or project configurations.
- Potential plan changes (upgrade/downgrade) based on usage.

Ensure your recommendations are clear, practical, and directly address cost efficiency and performance.`,
});

const aiPerformanceAssistantRecommendationsFlow = ai.defineFlow(
  {
    name: 'aiPerformanceAssistantRecommendationsFlow',
    inputSchema: AiPerformanceAssistantRecommendationsInputSchema,
    outputSchema: AiPerformanceAssistantRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
