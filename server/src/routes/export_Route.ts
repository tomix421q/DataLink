import { Hono } from 'hono'
import { prisma } from '../utils/db'
import { type ApiErrorResponse } from '@datalink/shared'
import { StatusCodes } from 'http-status-codes'

const exportRule = new Hono().get('/rule/:ruleId', async (c) => {
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

  // Csv
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

export default exportRule
