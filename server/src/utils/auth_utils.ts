import { prisma } from './db'

// for now not used
export const verifyMachineAccess = async (user: any, machineId: string) => {
  if (user.role === 'admin') return true

  const hasAccess = await prisma.machineAccess.findFirst({
    where: { userId: user.id, machineId },
  })

  return !!hasAccess
}
