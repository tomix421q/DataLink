import { Hono } from 'hono'
import { prisma } from '../utils/db'
import { type ApiErrorResponse } from '@datalink/shared'
import { StatusCodes } from 'http-status-codes'

const exportRule = new Hono()
  // Csv export logger
  .get('/rule/:ruleId', async (c) => {
    const ruleId = c.req.param('ruleId')

    const logs = await prisma.logEntry.findMany({
      where: {
        ruleId: ruleId,
      },
      orderBy: { timestamp: 'desc' },
    })

    if (logs.length === 0) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'There is no data yet for this rule.' }, StatusCodes.NOT_FOUND)
    }

    const firstSnapshop = JSON.parse(logs[0]!.snapshot)
    const headers = ['Timestamp', ...Object.keys(firstSnapshop)]

    const rows = logs.map((log) => {
      const data = JSON.parse(log.snapshot)

      const time = new Date(log.timestamp).toLocaleString('sk-SK')
      const rowValues = [time, ...Object.keys(firstSnapshop).map((key) => data[key] ?? '')]
      return rowValues.join(';')
    })

    const csvContent = [headers.join(';'), ...rows].join('\n')

    c.header('Content-Type', 'text/csv; charset=utf-8')
    c.header('Content-Disposition', `attachment; filename="export_rule.csv"`)

    return c.text(csvContent)
  })

  // Csv export tags
  .get('/tags/:machineId', async (c) => {
    try {
      const machineId = c.req.param('machineId')
      const tagsConfig = await prisma.tag.findMany({
        where: { machineId: machineId },
        select: { keyName: true, plcAddress: true, machineId: true },
        orderBy: { keyName: 'asc' },
      })
      if (tagsConfig.length === 0) {
        return c.json<ApiErrorResponse>(
          {
            ok: false,
            error: 'No tags found for this machine',
          },
          StatusCodes.NOT_FOUND,
        )
      }
      const headers = ['Tag Name', 'PLC Address', 'Machine ID']
      const rows = tagsConfig.map((tag) => {
        const safeKeyName = tag.keyName.replace(/;/g, ',')
        const safeAddress = tag.plcAddress.replace(/;/g, ',')
        return [safeKeyName, safeAddress, tag.machineId].join(';')
      })
      const csvContent = [headers.join(';'), ...rows].join('\n')
      c.header('Content-Type', 'text/csv; charset=utf-8')
      c.header('Content-Disposition', `attachment; filename="tag_${machineId}.csv"`)
      return c.text(csvContent)
    } catch (error) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'Problem with db,try again later.' }, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })
export default exportRule
