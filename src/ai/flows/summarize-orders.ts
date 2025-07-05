// 'use server'
'use server';

/**
 * @fileOverview Summarizes the items requested in orders for efficient stock management.
 *
 * - summarizeOrders - A function that summarizes the items requested in orders.
 * - SummarizeOrdersInput - The input type for the summarizeOrders function.
 * - SummarizeOrdersOutput - The return type for the summarizeOrders function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeOrdersInputSchema = z.object({
  orderItems: z
    .array(
      z.object({
        item: z.string(),
        quantity: z.number(),
      })
    )
    .describe('An array of items in the order with their quantities.'),
});
export type SummarizeOrdersInput = z.infer<typeof SummarizeOrdersInputSchema>;

const SummarizeOrdersOutputSchema = z.object({
  summary: z.string().describe('A summary of the items requested in the orders.'),
});
export type SummarizeOrdersOutput = z.infer<typeof SummarizeOrdersOutputSchema>;

export async function summarizeOrders(input: SummarizeOrdersInput): Promise<SummarizeOrdersOutput> {
  return summarizeOrdersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeOrdersPrompt',
  input: {schema: SummarizeOrdersInputSchema},
  output: {schema: SummarizeOrdersOutputSchema},
  prompt: `Eres un experto en gestión de inventario y logística. Tu tarea es resumir los items solicitados en los pedidos para que el gerente de almacén pueda entender rápidamente las necesidades de stock.

Pedidos:
{{#each orderItems}}
- {{quantity}} x {{item}}
{{/each}}

Resumen:`, 
});

const summarizeOrdersFlow = ai.defineFlow(
  {
    name: 'summarizeOrdersFlow',
    inputSchema: SummarizeOrdersInputSchema,
    outputSchema: SummarizeOrdersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
