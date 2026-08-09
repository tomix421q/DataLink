import { prisma } from '../utils/db'

export function startDatabaseCleaner() {
  const MAX_ROWS_PER_RULE = 100_000
  const ROWS_TO_KEEP = 90_000

  Bun.cron('0 * * * *', async () => {
    try {
      console.log('🧹 Cleaner DB: Start checking max rows in logs...')

      const rules = await prisma.logRule.findMany()

      for (const rule of rules) {
        const ruleLogsCount = await prisma.logEntry.count({
          where: { ruleId: rule.id },
        })

        if (ruleLogsCount > MAX_ROWS_PER_RULE) {
          const findEdgeToStart = await prisma.logEntry.findFirst({
            where: { ruleId: rule.id },
            orderBy: { timestamp: 'desc' },
            skip: ROWS_TO_KEEP - 1,
            select: { timestamp: true },
          })

          if (findEdgeToStart) {
            const deleted = await prisma.logEntry.deleteMany({
              where: {
                ruleId: rule.id,
                timestamp: {
                  lt: findEdgeToStart.timestamp,
                },
              },
            })

            console.log(`✅ Cleaner DB: Rule ${rule.name} with id ${rule.id} was deleted ${deleted.count} oldest logov.`)
          }
        }
      }
    } catch (err) {
      console.error('❌ Cleaner DB: Failed...')
    }
  })
}
