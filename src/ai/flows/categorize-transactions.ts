'use server';

/**
 * @fileOverview AI-powered transaction categorization flow.
 *
 * categorizeTransaction - A function that categorizes a transaction based on its description.
 * CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  description: z
    .string()
    .describe('A descrição da transação a ser categorizada.'),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  category: z.string().describe('A categoria prevista da transação.'),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(
  input: CategorizeTransactionInput
): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `Você é um especialista em finanças pessoais. Seu trabalho é categorizar transações com base na descrição delas.

  Aqui estão algumas categorias de exemplo: Supermercado, Restaurantes, Entretenimento, Contas, Aluguel, Salário, Investimentos, Compras, Transporte

  Dada a seguinte descrição da transação, forneça a categoria mais apropriada.

  Descrição: {{{description}}}
  Categoria: `,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
