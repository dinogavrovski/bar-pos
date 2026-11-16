import { z } from 'zod'
export const MAX_PAYMENT_DEN = 1_000_000
export const MAX_TIP_DEN = 10_000

export const takePaymentInput = z
  .object({
    method: z.enum(['cash', 'card'], { error: 'Payment method must be cash or card' }),
    amount: z
      .number()
      .int({ error: 'Please provide a whole number' })
      .positive({ error: 'Amount must be > 0' })
      .max(MAX_PAYMENT_DEN * 100, { error: `Amount must be at most ${MAX_PAYMENT_DEN} den` }),
    tip: z
      .number()
      .int({ error: 'Please provide a whole number' })
      .min(0, { error: "Tip can't be negative" })
      .max(MAX_TIP_DEN * 100, { error: `Tip must be at most ${MAX_TIP_DEN} den` })
      .default(0),
  })
  .refine((data) => data.method === 'card' || data.tip === 0, {
    error: 'Tip must be 0 den for cash payments',
    path: ['tip'],
  })

export type TakePaymentInput = z.infer<typeof takePaymentInput>
