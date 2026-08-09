import type { LogEntry } from '../../../prisma/generated/prisma/client'
import { prisma } from '../../utils/db'

export const logger_Service = {
  // Get downtimes machine by day,week,mount
  async getMachineDowntimeStats(machineId: string) {
    const now = new Date()
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const getDowntimeStats = async (fromDate: Date) => {
      const unplannedAgg = await prisma.downtimeLog.aggregate({
        _sum: { duration: true },
        where: {
          machineId,
          createdAt: { gte: fromDate },
          reason: 'Probable not planned',
        },
      })
      const totalAgg = await prisma.downtimeLog.aggregate({
        _sum: { duration: true },
        where: {
          machineId,
          createdAt: { gte: fromDate },
          OR: [{ reason: { not: 'Probable not planned' } }, { reason: null }],
        },
      })
      return { unplanned: unplannedAgg._sum.duration || 0, total: totalAgg._sum.duration || 0 }
    }

    // get db
    const [stats24h, stats7d, stats30d] = await Promise.all([
      getDowntimeStats(past24h),
      getDowntimeStats(past7d),
      getDowntimeStats(past30d),
    ])

    return { _24h: stats24h, _7d: stats7d, _30d: stats30d }
  },

  // get log data entries
  async getLoggerDataEntries(machineId: string, logId: string, limit: number, skip: number) {
    const [data, totalCount] = await Promise.all([
      prisma.logEntry.findMany({
        where: { machineId, ruleId: logId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.logEntry.count({
        where: { machineId, ruleId: logId },
      }),
    ])

    return { data, totalCount }
  },

  formatLoggerDataEntrie(data: LogEntry[]) {
    const formattedEntries = data.map((entry) => {
      let snapshot = {}
      try {
        snapshot = JSON.parse(entry.snapshot)
      } catch (e) {
        snapshot = { error: 'Bad JSON format in database' }
      }
      return { ...entry, snapshot }
    })
    return formattedEntries
  },
}
