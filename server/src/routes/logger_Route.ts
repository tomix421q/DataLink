import { Hono } from 'hono'
import { prisma } from '../utils/db'
import { StatusCodes } from 'http-status-codes'
import { zValidator } from '@hono/zod-validator'
import { createRuleSchema, type ApiErrorResponse } from '@datalink/shared'
import { validationHook } from '../utils/validator'
import { logger_Service } from '../services/routesService/logger_Service'
import { requireAuth, requireRole } from '../middleware/auth'
import z from 'zod'
import { logEngine } from '../globals'

const logger = new Hono()

  // Create new logger Rule
  .post('/', requireAuth, requireRole(['admin', 'engineer']), zValidator('json', createRuleSchema, validationHook), async (c) => {
    const body = c.req.valid('json')

    // For future
    // if (!(await verifyMachineAccess(user, body.machineId))) {
    //   return c.json({ ok: false, error: 'You didnt have permssion to this machine' }, 403)
    // }
    try {
      if (body.triggerType === 'CHANGE' && !body.triggerTag) {
        return c.json<ApiErrorResponse>(
          { ok: false, error: 'You must select trigger tag when trigger type is CHANGE' },
          StatusCodes.BAD_REQUEST,
        )
      }
      if (body.triggerType === 'EDGE' && !body.triggerTag) {
        return c.json<ApiErrorResponse>(
          { ok: false, error: 'You must select trigger tag when trigger type is Edge condition' },
          StatusCodes.BAD_REQUEST,
        )
      }
      const machineIdExist = await prisma.machine.findUnique({ where: { id: body.machineId } })
      if (!machineIdExist) return c.json<ApiErrorResponse>({ ok: false, error: 'Machine id not found' }, StatusCodes.NOT_FOUND)

      const savedRule = await prisma.logRule.create({
        data: {
          userId: c.get('user').id,
          name: body.name,
          machineId: body.machineId,
          triggerType: body.triggerType,
          interval: body.interval,
          tagToSave: JSON.stringify(body.tags),
          triggerTag: body.triggerTag,
          triggerOperator: body.triggerOperator,
          triggerValue: body.triggerValue !== undefined ? String(body.triggerValue) : null,
        },
      })
      logEngine.addNewRule(savedRule)
      return c.json({ ok: true, rule: savedRule }, StatusCodes.CREATED)
    } catch (error) {
      return c.json<ApiErrorResponse>(
        {
          ok: false,
          error: 'Problem with db, please try again later.',
          details: { database: [String(error)] },
        },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })

  // Delete logger Rule
  .delete('/:id', requireAuth, requireRole(['engineer', 'admin']), async (c) => {
    const id = c.req.param('id')
    const rule = await prisma.logRule.findUnique({ where: { id } })
    if (!rule) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'Rule not found' }, StatusCodes.NOT_FOUND)
    }
    await prisma.logRule.delete({ where: { id } })
    logEngine.removeRuleFromRam(rule.machineId, rule.id)

    return c.json({ ok: true, message: 'Rule deleted successfully' })
  })

  // Delete logger rule DATA
  .delete(
    '/logsdelete/:logId',
    requireAuth,
    requireRole(['admin', 'engineer']),
    zValidator(
      'json',
      z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional(), entryId: z.string().optional() }).refine(
        (data) => {
          if (data.entryId) return true
          if (data.from && data.to) return true
          return false
        },
        { message: 'Required from&to or specific logId' },
      ),
      validationHook,
    ),
    async (c) => {
      const loggerId = c.req.param('logId')
      const { from, to, entryId } = c.req.valid('json')

      const logger = await prisma.logRule.findUnique({
        where: {
          id: loggerId,
        },
      })
      if (!logger) {
        return c.json<ApiErrorResponse>(
          { ok: false, error: `This rule does not exist.`, details: [{ id: loggerId }] },
          StatusCodes.NOT_FOUND,
        )
      }

      const whereClause: any = {
        ruleId: loggerId,
      }

      if (entryId) {
        const isExist = await prisma.logEntry.findFirst({ where: { id: Number(entryId) } })
        if (!isExist) {
          return c.json<ApiErrorResponse>({ ok: false, error: 'This id does not exist in db' }, StatusCodes.NOT_FOUND)
        }
        whereClause.id = Number(entryId)
      } else if (from && to) {
        if (from >= to) {
          return c.json<ApiErrorResponse>({ ok: false, error: 'From time must be lowest' }, StatusCodes.BAD_REQUEST)
        }
        whereClause.timestamp = {
          gte: from,
          lte: to,
        }
      }

      // Del
      const deletedLogs = await prisma.logEntry.deleteMany({
        where: whereClause,
      })

      return c.json(
        { ok: true, message: entryId ? `Log entry id ${entryId} deleted.` : `${deletedLogs.count} logs was successful deleted` },
        StatusCodes.OK,
      )
    },
  )

  // Update logger Rule
  .put('/:id', requireAuth, zValidator('json', createRuleSchema, validationHook), async (c) => {
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const existingRule = await prisma.logRule.findUnique({ where: { id } })
    if (!existingRule) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'Rule not found' }, StatusCodes.NOT_FOUND)
    }
    const machineChanged = existingRule.machineId !== body.machineId
    if (machineChanged) {
      logEngine.removeRuleFromRam(existingRule.machineId, existingRule.id)
    }

    const updatedRule = await prisma.logRule.update({
      where: { id },
      data: {
        name: body.name,
        machineId: body.machineId,
        triggerType: body.triggerType,
        interval: body.interval,
        tagToSave: JSON.stringify(body.tags),
        triggerTag: body.triggerTag,
        triggerValue: body.triggerValue !== undefined ? String(body.triggerValue) : null,
        triggerOperator: body.triggerOperator,
      },
    })

    logEngine.updateRuleInRam(updatedRule)
    return c.json({ ok: true, rule: updatedRule })
  })

  // Get all Rules
  .get('/', async (c) => {
    const rules = await prisma.logRule.findMany({ orderBy: { name: 'desc' }, include: { user: { select: { name: true } } } })
    const formattedRules = rules.map((rule) => {
      let tags: string[] = []
      try {
        tags = JSON.parse(rule.tagToSave)
      } catch (e) {
        tags = []
      }
      return { ...rule, tags }
    })
    return c.json({ ok: true, rules: formattedRules })
  })

  // Get rule by machine id
  .get('/machine/:machineId', async (c) => {
    const machineId = c.req.param('machineId')
    const rules = await prisma.logRule.findMany({
      where: { machineId },
      orderBy: { name: 'desc' },
      include: { user: { select: { name: true } } },
    })

    if (rules.length === 0) {
      return c.json({ ok: true, rules: [] }, StatusCodes.OK)
    }

    const formattedRules = rules.map((rule) => {
      let tags: string[] = []
      try {
        tags = JSON.parse(rule.tagToSave)
      } catch (e) {
        tags = []
      }
      return { ...rule, tags }
    })

    return c.json({ ok: true, rules: formattedRules }, StatusCodes.OK)
  })

  // Get data from logrule
  .get(
    '/machine/log/:machineId/:logId',
    zValidator('query', z.object({ page: z.string().optional(), limit: z.string().optional() })),
    async (c) => {
      const machineId = c.req.param('machineId')
      const logId = c.req.param('logId')
      const query = c.req.valid('query')
      const page = Number(query.page) || 1
      const limit = Number(query.limit) || 100
      const skip = (page - 1) * limit

      try {
        const dbData = await logger_Service.getLoggerDataEntries(machineId, logId, limit, skip)
        const totalPages = Math.ceil(dbData.totalCount / limit)

        if (dbData.data.length === 0) {
          return c.json(
            {
              ok: true,
              data: [],
              details: { totalCount: dbData.totalCount, page, limit, totalPages },
            },
            StatusCodes.OK,
          )
        }
        const formattedEntries = logger_Service.formatLoggerDataEntrie(dbData.data)
        return c.json(
          {
            ok: true,
            data: formattedEntries,
            details: { totalCount: dbData.totalCount, page, limit, totalPages },
          },
          StatusCodes.OK,
        )
      } catch (error) {
        return c.json({ ok: false, error: String(error) }, StatusCodes.INTERNAL_SERVER_ERROR)
      }
    },
  )

  //
  // Downtimes logs
  .get('/downtime/:machineId', async (c) => {
    const machineId = c.req.param('machineId')

    const machineExists = await prisma.machine.findUnique({ where: { id: machineId } })
    if (!machineExists) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'Machine not found' }, StatusCodes.NOT_FOUND)
    }

    const downtimeData = await logger_Service.getMachineDowntimeStats(machineId)

    // console.log(downtimeData)
    return c.json({
      ok: true,
      data: { machineId, machineName: machineExists.name, ...downtimeData },
    })
  })

export default logger
