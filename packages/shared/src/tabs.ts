import { z } from 'zod'

export const openTabInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(50, { error: 'Name must be at most 50 characters' }),
  people: z
    .number()
    .int({ error: 'Please provide a whole number' })
    .positive({ error: 'Number of people must be > 0' })
    .max(100, { error: 'People must be at most 100' }),
})

export type OpenTabInput = z.infer<typeof openTabInput>
