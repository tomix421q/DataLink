import { Hono } from 'hono'
import { requireAuth, requireRole } from '../middleware/auth'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { validationHook } from '../utils/validator'
import type { ApiErrorResponse } from '@datalink/shared'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../utils/db'
import { machineBucket } from '../globals'

const publicFavorites = new Hono()
  // Get public dashboards
  .get('/publicdash', async (c) => {
    const dashboards = await prisma.publicDashboard.findMany({
      include: {
        folders: {
          orderBy: { order: 'asc' },
          include: {
            folder: {
              include: {
                machine: { select: { id: true, name: true } },
                tags: true,
              },
            },
          },
        },
      },
    })
    return c.json({ ok: true, data: dashboards })
  })
  // Get specific public dashboard with live PLC polling data
  .get('/publicdash/:dashboardId/live', async (c) => {
    try {
      const dashboardId = c.req.param('dashboardId')

      const dashboard = await prisma.publicDashboard.findUnique({
        where: { id: dashboardId },
        include: {
          folders: {
            orderBy: { order: 'asc' },
            include: {
              folder: {
                select: {
                  id: true,
                  name: true,
                  machineId: true,
                  machine: { select: { id: true, name: true } },
                  tags: { select: { keyName: true } },
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      })

      if (!dashboard) {
        return c.json<ApiErrorResponse>({ ok: false, error: 'Public dashboard not found.' }, StatusCodes.NOT_FOUND)
      }
      const uniqueMachineIds = new Set<string>()
      for (const item of dashboard.folders) {
        if (item.folder?.machineId) {
          uniqueMachineIds.add(item.folder.machineId)
        }
      }
      const liveData: Record<string, any> = {}
      for (const item of dashboard.folders) {
        const folder = item.folder
        if (!folder) continue
        const rawData = machineBucket.getLatestData(folder.machineId)
        if (!rawData) continue

        // 2. Ak pre tento stroj ešte nemáme objekt, inicializuj ho
        liveData[folder.machineId] ??= {}

        // 3. Prekopíruj iba tie tagy, ktoré má zložka v DB
        for (const tag of folder.tags) {
          if (rawData[tag.keyName] !== undefined) {
            liveData[folder.machineId][tag.keyName] = rawData[tag.keyName]
          }
        }
      }
      return c.json(
        {
          ok: true,
          data: {
            dashboard: {
              id: dashboard.id,
              name: dashboard.name,
              description: dashboard.description,
              folders: dashboard.folders.map((f) => ({
                subscriptionId: f.id,
                order: f.order,
                ...f.folder,
              })),
            },
            liveData,
          },
        },
        StatusCodes.OK,
      )
    } catch (error: any) {
      console.error('[Public Dashboard Error]', error)
      return c.json<ApiErrorResponse>(
        {
          ok: false,
          error: 'Problem with loading public dashboard, try again later.',
          details: { database: [String(error.message || error)] },
        },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })
  // Create public dashboard
  .post(
    '/publicdash/create',
    requireAuth,
    requireRole(['engineer', 'admin']),
    zValidator(
      'json',
      z.object({
        name: z.string().min(3).max(32),
        description: z.string().max(64).optional(),
      }),
      validationHook,
    ),
    async (c) => {
      try {
        const { name, description } = c.req.valid('json')
        const newPublicDash = await prisma.publicDashboard.create({
          data: {
            name,
            description,
          },
        })
        return c.json(
          {
            ok: true,
            message: `Public dashboard with name ${newPublicDash.name} has created`,
            details: newPublicDash,
          },
          StatusCodes.CREATED,
        )
      } catch (error: any) {
        if (error.code === 'P2002') {
          const errorMessage = String(error.message || error)
          if (errorMessage?.includes('name')) {
            return c.json<ApiErrorResponse>(
              {
                ok: false,
                error: 'Validation failed',
                details: { name: ['This name already exists'] },
              },
              StatusCodes.CONFLICT,
            )
          }
        }
        return c.json<ApiErrorResponse>({
          ok: false,
          error: 'Problem with database, please try again later',
          details: { database: [String(error)] },
        })
      }
    },
  )
  // Delete public dashboard
  .delete('/publicdash/delete/:dashboardId', requireAuth, requireRole(['admin', 'engineer']), async (c) => {
    try {
      const publicDashboardId = c.req.param('dashboardId')

      const isExist = await prisma.publicDashboard.findFirst({ where: { id: publicDashboardId } })
      if (!isExist) {
        return c.json<ApiErrorResponse>({ ok: false, error: 'This public dashboard id not exist' }, StatusCodes.NOT_FOUND)
      }
      const deleteDash = await prisma.publicDashboard.delete({ where: { id: isExist.id } })
      return c.json(
        { ok: true, data: isExist, message: `Public dashboard with name ${isExist.name} has successfuly deleted` },
        StatusCodes.OK,
      )
    } catch (error) {
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with database, try again later' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })
  // Add/remove folder to public dashboard
  .post(
    '/publicdash/addfolder',
    requireAuth,
    requireRole(['admin', 'engineer']),
    zValidator(
      'json',
      z.object({
        dashboardId: z.string(),
        folderId: z.string(),
        order: z.coerce.number().int().positive(),
      }),
      validationHook,
    ),
    async (c) => {
      try {
        const { dashboardId, folderId, order } = c.req.valid('json')
        // if exist folder in dashboard
        const isExistFolderInDash = await prisma.publicDashboard.findFirst({
          where: {
            id: dashboardId,
            folders: {
              some: {
                folderId: folderId,
              },
            },
          },
        })
        if (isExistFolderInDash) {
          const deletedFolder = await prisma.publicFolderSubscription.delete({
            where: {
              dashboardId_folderId: {
                dashboardId,
                folderId,
              },
            },
          })
          return c.json(
            {
              ok: true,
              data: deletedFolder,
              message: `Folder removed from public dashbord - ${isExistFolderInDash.name} `,
            },
            StatusCodes.OK,
          )
        }

        // if create
        const [folder, dashboard, addToDashboard] = await prisma.$transaction([
          prisma.favoriteFolder.findFirst({ where: { id: folderId } }),
          prisma.publicDashboard.findFirst({ where: { id: dashboardId } }),
          prisma.publicFolderSubscription.create({ data: { dashboardId, folderId, order } }),
        ])

        return c.json(
          {
            ok: true,
            data: addToDashboard,
            message: `Folder ${folder?.name} added to public dashbord -  ${dashboard?.name} successfuly`,
          },
          StatusCodes.CREATED,
        )
      } catch (error: any) {
        if (error.code === 'P2002') {
          const errorMessage = String(error.message || error)
          if (errorMessage?.includes('folderId')) {
            return c.json<ApiErrorResponse>(
              {
                ok: false,
                error: 'Validation failed',
                details: { folderId: ['This folder id is already existed in this public dashboard'] },
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
  // Delete from public dashboard
  .delete('/publicdash/deletefolder/:folderId/:dashboardId', requireAuth, requireRole(['admin', 'engineer']), async (c) => {
    try {
      const { folderId, dashboardId } = c.req.param()
      const [isExistDashboard, isExistFolder, deleteFolder] = await prisma.$transaction([
        prisma.publicDashboard.findFirst({ where: { id: dashboardId } }),
        prisma.favoriteFolder.findFirst({
          where: {
            id: folderId,
          },
        }),
        prisma.publicFolderSubscription.delete({
          where: {
            dashboardId_folderId: {
              dashboardId,
              folderId,
            },
          },
        }),
      ])
      return c.json({
        ok: true,
        data: deleteFolder,
        message: `Folder ${isExistFolder?.name} has removed from ${isExistDashboard?.name} successfuly`,
      })
    } catch (error: any) {
      return c.json<ApiErrorResponse>({
        ok: false,
        error: `Problem with database, please try again later, error: ${String(error.message)}`,
      })
    }
  })

export default publicFavorites
