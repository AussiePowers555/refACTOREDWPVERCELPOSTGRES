import { z } from "zod"

export const transactionSchema = z.object({
  id: z.string(),
  caseNumber: z.string().min(1, "Please select a case."),
  type: z.enum(['Payment', 'Invoice']),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  status: z.enum(['Completed', 'Pending', 'Sent', 'Draft', 'Failed']),
  date: z.string(),
})

export type Transaction = z.infer<typeof transactionSchema>;
