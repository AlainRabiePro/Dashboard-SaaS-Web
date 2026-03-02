'use server';
/**
 * @fileOverview A Genkit flow that suggests optimal server resource configurations and hosting plans
 * based on a natural language description of a project.
 *
 * - aiProjectConfigurator - A function that handles the AI project configuration process.
 * - AiProjectConfiguratorInput - The input type for the aiProjectConfigurator function.
 * - AiProjectConfiguratorOutput - The return type for the aiProjectConfigurator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiProjectConfiguratorInputSchema = z.object({
  projectDescription: z
    .string()
    .describe("A natural language description of the project's purpose and expected usage."),
});
export type AiProjectConfiguratorInput = z.infer<typeof AiProjectConfiguratorInputSchema>;

const AiProjectConfiguratorOutputSchema = z.object({
  suggestedRam: z.number().describe('Suggested RAM in GB (e.g., 2, 4, 8, 16).'),
  suggestedCpuCores: z.number().describe('Suggested number of CPU cores (e.g., 1, 2, 4, 8).'),
  suggestedStorageGb: z.number().describe('Suggested storage in GB (e.g., 50, 100, 200, 500).'),
  suggestedHostingPlan:
    z.enum(['Personal', 'Starter', 'Pro']).describe('Suggested hosting plan based on the project description.'),
  recommendationReasoning: z
    .string()
    .describe('A brief explanation for the suggested configuration.'),
});
export type AiProjectConfiguratorOutput = z.infer<typeof AiProjectConfiguratorOutputSchema>;

export async function aiProjectConfigurator(
  input: AiProjectConfiguratorInput
): Promise<AiProjectConfiguratorOutput> {
  return aiProjectConfiguratorFlow(input);
}

const projectConfiguratorPrompt = ai.definePrompt({
  name: 'projectConfiguratorPrompt',
  input: { schema: AiProjectConfiguratorInputSchema },
  output: { schema: AiProjectConfiguratorOutputSchema },
  prompt: `You are an expert cloud infrastructure architect and hosting plan advisor for ServerSphere, a VPS hosting management platform.
Your task is to analyze a user's project description and recommend optimal server resource configurations (RAM, CPU, storage) and a suitable hosting plan.

Consider the following hosting plans and their general characteristics:
- Personal: Best for very small projects, prototypes, or hobby sites with minimal traffic.
- Starter: Suitable for small personal websites, blogs, or development environments. Limited resources.
- Pro: Ideal for medium-sized applications, e-commerce sites, or projects with moderate traffic. Balanced resources.

Based on the provided project description, suggest:
1.  Optimal RAM in GB (e.g., 2, 4, 8, 16)
2.  Optimal CPU cores (e.g., 2, 4, 8)
3.  Optimal storage in GB (e.g., 10, 50)
4.  The most suitable hosting plan from 'Personal', 'Starter', or 'Pro'.
5.  A brief explanation for your recommendation.

Project Description: {{{projectDescription}}}`,
});

const aiProjectConfiguratorFlow = ai.defineFlow(
  {
    name: 'aiProjectConfiguratorFlow',
    inputSchema: AiProjectConfiguratorInputSchema,
    outputSchema: AiProjectConfiguratorOutputSchema,
  },
  async (input) => {
    const { output } = await projectConfiguratorPrompt(input);
    return output!;
  }
);
