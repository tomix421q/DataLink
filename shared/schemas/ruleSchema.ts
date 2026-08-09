import { z } from 'zod'

export const createRuleSchema = z.object({
  name: z.string().min(3),
  machineId: z.string().min(3),
  triggerType: z.enum(['CHANGE', 'TIME', 'EDGE']),
  interval: z.number().positive().min(5000).max(3600000).optional(),
  tags: z.array(z.string()).min(1),
  triggerTag: z.string().optional(),
  triggerValue: z.union([z.string(), z.number()]).optional(),
  triggerOperator: z.enum(['>', '<', '>=', '<=', '==', '!=']).optional().default('=='),
})
export type CreateRuleInput = z.infer<typeof createRuleSchema>
export type TriggerValue = CreateRuleInput['triggerType']
