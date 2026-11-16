import { z } from 'zod'

// Limits no real order reaches: they catch typos (quantity 200) and abuse (100,000 lines).
export const MAX_LINES = 100
export const MAX_QUANTITY = 50
// About three lines on an 80mm thermal ticket.
export const MAX_NOTE_LENGTH = 100

// ONE line of an order: "2 × Skopsko 0.5 for person 1" or "1 × Pasta Pomodoro, no olives".
// The API expands each line into `quantity` rows in tab_items (one row per unit).
// No price here: the API looks it up in the menu, so a client can't change it.
const line = z.object({
  itemId: z
    .number({ error: 'Pick an item from the menu' })
    .int({ error: 'Pick an item from the menu' })
    .positive({ error: 'Pick an item from the menu' }),

  quantity: z
    .number()
    .int({ error: 'Quantity must be a whole number' })
    .min(1, { error: 'Quantity must be at least 1' })
    .max(MAX_QUANTITY, { error: `Quantity must be at most ${MAX_QUANTITY}` }),

  // Which guest ordered it. Optional: not every tab is split by person.
  // "Person 7 on a tab for 3" can't be checked here (the schema doesn't know the tab): API rule.
  person: z
    .number()
    .int({ error: 'Person must be a whole number' })
    .min(1, { error: 'Person must be at least 1' })
    .optional(),

  // Free text for the kitchen/bar, e.g. "no olives". Trim first (JS trim also removes \n and tabs),
  // check the length, then turn an empty note into "no note" so the DB never sees "" or "\n".
  note: z
    .string()
    .trim()
    .max(MAX_NOTE_LENGTH, { error: `Note must be at most ${MAX_NOTE_LENGTH} characters` })
    .transform((note) => (note === '' ? undefined : note))
    .optional(),
})

export const addItemsInput = z.object({
  items: z
    .array(line)
    .min(1, { error: 'Add at least one item' })
    .max(MAX_LINES, { error: `At most ${MAX_LINES} lines per order` }),
})

export type AddItemsInput = z.infer<typeof addItemsInput>
