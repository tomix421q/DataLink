import { Hono } from 'hono'
import { prisma } from '../utils/db'
import { StatusCodes } from 'http-status-codes'
import { createNewMachineSchema, type ApiErrorResponse } from '@datalink/shared'
import { requireAuth, requireRole } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import { validationHook } from '../utils/validator'
import z from 'zod'
import { verifyPlcTag } from '../services/basic/verify_tagConnection'
import { machineBucket } from '../globals'

const machines = new Hono()
  // Get all machines
  .get('/', async (c) => {
    try {
      const machines = await prisma.machine.findMany({ select: { id: true, name: true, ip: true }, orderBy: { name: 'asc' } })
      return c.json({ ok: true, machines }, StatusCodes.OK)
    } catch (error) {
      return c.json({ ok: false, machines: [], error: 'Failed to load machines' }, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })
  // Get single machine
  .get('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const machine = await prisma.machine.findUnique({ where: { id }, select: { id: true, name: true, ip: true } })
      if (!machine) {
        return c.json<ApiErrorResponse>({ ok: false, error: 'Machine not found' }, StatusCodes.NOT_FOUND)
      }
      return c.json({ ok: true, machine }, StatusCodes.OK)
    } catch (error) {
      return c.json<ApiErrorResponse>({ ok: false, error: `Failed to load machine ${id}` }, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })
  // Add new machine
  .post('/create', requireAuth, requireRole(['admin']), zValidator('json', createNewMachineSchema, validationHook), async (c) => {
    const body = c.req.valid('json')

    try {
      const newMachine = await prisma.machine.create({
        data: {
          id: body.id,
          name: body.name,
          ip: body.ip,
          rack: body.rack,
          slot: body.slot,
          interval: body.interval,
        },
      })
      if (newMachine) {
        machineBucket.addMachine({
          id: newMachine.id,
          config: { plc: { name: body.name, ip: body.ip, rack: body.rack, slot: body.slot, interval: body.interval }, tags: {} },
        })
      }
      return c.json({ ok: true, data: newMachine }, StatusCodes.CREATED)
    } catch (error: any) {
      // If machine or ip exist [db schema for ip or machine is @uniq]
      if (error.code === 'P2002') {
        return c.json<ApiErrorResponse>(
          {
            ok: false,
            error: 'Validation failed',
            details: { ip: ['Machine with this IP or Name already exists'] },
          },
          StatusCodes.CONFLICT,
        )
      }
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with DB', details: { database: [String(error)] } },
        StatusCodes.BAD_REQUEST,
      )
    }
  })
  //Add new tag from plc
  .post(
    '/addtag',
    requireAuth,
    requireRole(['admin']),
    zValidator(
      'json',
      z.object({
        keyName: z.string().min(2).max(22),
        plcAddress: z.string().min(4).max(32),
        machineId: z.string().min(2).max(32),
      }),
      validationHook,
    ),
    async (c) => {
      const { keyName, plcAddress, machineId } = c.req.valid('json')

      try {
        // Is machine exist?
        const isExistMachine = await prisma.machine.findFirst({ where: { id: machineId } })
        if (!isExistMachine) {
          return c.json<ApiErrorResponse>({ ok: false, error: 'This machine does not exist in db' }, StatusCodes.NOT_FOUND)
        }

        // Is tag real in the plc?
        const tagTest = await verifyPlcTag(isExistMachine.ip, isExistMachine.rack, isExistMachine.slot, plcAddress)
        if (!tagTest.ok) {
          return c.json<ApiErrorResponse>(
            {
              ok: false,
              error: tagTest.error || 'Bad plc tag address',
              details: {
                Info: ['You probably entered the wrong tag address. This tag has no value after checking in the specific PLC'],
              },
            },
            StatusCodes.BAD_REQUEST,
          )
        }

        // Create tag in db and plug into machine bucket
        const newTag = await prisma.tag.create({
          data: {
            keyName,
            plcAddress,
            machineId,
          },
        })
        machineBucket.loadSpecificMachineFromDb(machineId)

        return c.json({ ok: true, data: newTag }, StatusCodes.CREATED)
      } catch (error: any) {
        console.log(error.code)
        if (error.code === 'P2002') {
          const errorMessage = String(error.message || error)
          if (errorMessage?.includes('plcAddress')) {
            return c.json<ApiErrorResponse>(
              {
                ok: false,
                error: 'Validation failed',
                details: { plcAddress: ['This PLC address is already used on the machine'] },
              },
              StatusCodes.CONFLICT,
            )
          }

          if (errorMessage?.includes('keyName')) {
            return c.json<ApiErrorResponse>(
              {
                ok: false,
                error: 'Validation failed',
                details: { keyName: ['A tag with this name already exists on the machine.'] },
              },
              StatusCodes.CONFLICT,
            )
          }
        }
        return c.json<ApiErrorResponse>(
          {
            ok: false,
            error: 'Problem with database, please try again later',
            details: { database: [String(error)] },
          },
          StatusCodes.INTERNAL_SERVER_ERROR,
        )
      }
    },
  )
  // Delete tags
  .delete(
    '/tagsremove/:machineId',
    requireAuth,
    requireRole(['admin']),
    zValidator(
      'json',
      z.object({
        tagsNames: z.array(z.string()).min(1),
      }),
      validationHook,
    ),
    async (c) => {
      const machineId = c.req.param('machineId')
      const { tagsNames } = c.req.valid('json')

      try {
        const deletedTags = await prisma.tag.deleteMany({
          where: {
            machineId: machineId,
            keyName: {
              in: tagsNames,
            },
          },
        })
        if (deletedTags.count === 0) {
          return c.json<ApiErrorResponse>({ ok: false, error: `No tags found to delete.` }, StatusCodes.NOT_FOUND)
        }
        machineBucket.loadSpecificMachineFromDb(machineId)
        return c.json({ ok: true, data: `Deleted ${deletedTags.count} tags, with names: ${tagsNames}` }, StatusCodes.OK)
      } catch (error) {
        return c.json<ApiErrorResponse>(
          { ok: false, error: `Problem with deleting tags, try again later.` },
          StatusCodes.INTERNAL_SERVER_ERROR,
        )
      }
    },
  )
  // Delete machine
  .delete('/machineremove/:machineId', requireAuth, requireRole(['admin']), async (c) => {
    try {
      const machineId = c.req.param('machineId')
      const deleteMachine = await prisma.machine.deleteMany({
        where: {
          id: machineId,
        },
      })
      if (deleteMachine.count === 0) {
        return c.json<ApiErrorResponse>(
          { ok: false, error: `Machine with this id not found, try again later` },
          StatusCodes.NOT_FOUND,
        )
      }
      machineBucket.loadFromDb()
      return c.json({ ok: true, data: `Machine with id ${machineId} was deleted` }, StatusCodes.OK)
    } catch (error) {
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with delete machine, try again later' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })

export default machines
