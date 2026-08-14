import { z } from 'zod'

export const createNewMachineSchema = z.object({
  id: z.string().max(16).min(3).optional(),
  name: z.string().min(3).max(32),
  ip: z.ipv4(),
  rack: z.number().min(0).max(32).default(0),
  slot: z.number().min(0).max(32).default(1),
  interval: z.number().min(3000).max(30000).default(3000),
})
export type CreateNewMachine = z.infer<typeof createNewMachineSchema>
