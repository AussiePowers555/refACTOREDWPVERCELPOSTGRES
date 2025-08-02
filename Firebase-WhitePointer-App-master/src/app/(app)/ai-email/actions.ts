"use server";

import { generateAiAssistedEmailTemplates, type GenerateAiAssistedEmailTemplatesInput } from '@/ai/flows/generate-email-template';

export async function generateEmailAction(input: GenerateAiAssistedEmailTemplatesInput) {
    try {
        const result = await generateAiAssistedEmailTemplates(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to generate email: ${errorMessage}` };
    }
}
