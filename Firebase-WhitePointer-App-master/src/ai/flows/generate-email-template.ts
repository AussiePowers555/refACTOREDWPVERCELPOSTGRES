'use server';

/**
 * @fileOverview An AI agent for generating AI-assisted email templates for collections agents.
 *
 * - generateAiAssistedEmailTemplates - A function that handles the AI-assisted email template generation process.
 * - GenerateAiAssistedEmailTemplatesInput - The input type for the generateAiAssistedEmailTemplates function.
 * - GenerateAiAssistedEmailTemplatesOutput - The return type for the generateAiAssistedEmailTemplates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiAssistedEmailTemplatesInputSchema = z.object({
  recipientType: z.enum([
    'insurance_company',
    'client',
    'at_fault_party',
    'collections_agency',
    'legal_counsel',
    'service_provider',
  ]).describe('The type of recipient for the email.'),
  purpose: z.enum([
    'demand_payment',
    'status_update',
    'document_request',
    'settlement_negotiation',
    'appointment_scheduling',
    'claim_closure',
    'follow_up',
  ]).describe('The purpose of the email.'),
  tone: z.enum([
    'professional',
    'friendly',
    'formal',
    'urgent',
    'apologetic',
    'persuasive',
  ]).describe('The tone of the email.'),
  additionalContext: z.string().describe('Any specific details or requirements for this email.'),
  caseNumber: z.string().optional().describe('The case number associated with the email.'),
});

export type GenerateAiAssistedEmailTemplatesInput = z.infer<typeof GenerateAiAssistedEmailTemplatesInputSchema>;

const GenerateAiAssistedEmailTemplatesOutputSchema = z.object({
  subject: z.string().describe('The generated subject line for the email.'),
  body: z.string().describe('The generated body of the email.'),
});

export type GenerateAiAssistedEmailTemplatesOutput = z.infer<typeof GenerateAiAssistedEmailTemplatesOutputSchema>;

export async function generateAiAssistedEmailTemplates(input: GenerateAiAssistedEmailTemplatesInput): Promise<GenerateAiAssistedEmailTemplatesOutput> {
  return generateAiAssistedEmailTemplatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiAssistedEmailTemplatesPrompt',
  input: {schema: GenerateAiAssistedEmailTemplatesInputSchema},
  output: {schema: GenerateAiAssistedEmailTemplatesOutputSchema},
  prompt: `You are a professional business communication assistant specializing in insurance and legal correspondence.\n\nGenerate a professional email with the following requirements:\n- Recipient Type: {{{recipientType}}}\n- Purpose: {{{purpose}}}\n- Tone: {{{tone}}}\n\nAdditional Context: {{{additionalContext}}}\n\n{{~#if caseNumber}}Case Number: {{{caseNumber}}}{{/if}}\n\nPlease generate:\n1. A professional subject line\n2. A complete email body that is courteous, clear, and actionable\n\nThe email should maintain a {{{tone}}} tone and be appropriate for {{{recipientType}}} communication.\n`,
});

const generateAiAssistedEmailTemplatesFlow = ai.defineFlow(
  {
    name: 'generateAiAssistedEmailTemplatesFlow',
    inputSchema: GenerateAiAssistedEmailTemplatesInputSchema,
    outputSchema: GenerateAiAssistedEmailTemplatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
