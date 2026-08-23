import { Hono } from 'hono'
import { optionalAuth, requireAuth } from '../middleware/auth'
import { prisma } from '../utils/db'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'
import { validationHook } from '../utils/validator'
import { StatusCodes } from 'http-status-codes'
import { type ApiErrorResponse, ROLES } from '@datalink/shared'
import { machineBucket } from '../globals'
import type { Prisma, User } from '../../prisma/generated/prisma/client'

type Env = {
  Variables: {
    user?: User | null
  }
}

const favorites = new Hono<Env>()
  // Main dashboard pooling
  .get('/maindashboard/folder/live', requireAuth, async (c) => {
    try {
      const userId = c.get('user').id

      const [folders, rawSubs] = await Promise.all([
        await prisma.favoriteFolder.findMany({
          where: {
            userId: userId,
            showOnMainDashboard: true,
          },
          select: { id: true, name: true, machineId: true, tags: { select: { keyName: true } } },
        }),
        await prisma.folderSubscription.findMany({
          where: { userId },
          select: {
            id: true,
            machineId: true,
            folder: {
              select: {
                id: true,
                name: true,
                tags: { select: { keyName: true } },
                user: { select: { name: true } },
              },
            },
          },
        }),
      ])

      // get all machines ids
      const uniqueMachineIds = new Set<string>()
      for (const f of folders) uniqueMachineIds.add(f.machineId)
      for (const s of rawSubs) uniqueMachineIds.add(s.machineId)
      // get live data from plcs
      const liveData: Record<string, any> = {}
      for (const machineId of uniqueMachineIds) {
        const data = machineBucket.getLatestData(machineId)
        if (data) {
          liveData[machineId] = data
        }
      }
      return c.json({ ok: true, data: { folders, subsFolders: rawSubs, liveData } }, StatusCodes.OK)
    } catch (error) {
      console.error('[Dashboard Error]', error)
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with loading main dashboard, try again later.' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })

  // Get all folders user
  .get('/:machineId/folders', requireAuth, async (c) => {
    const user = c.get('user')
    const machineId = c.req.param('machineId')
    const isAdmin = user.role === ROLES.ADMIN
    try {
      const where: Prisma.FavoriteFolderWhereInput = {
        machineId,
        ...(isAdmin ? {} : { userId: user.id }),
      }
      const folders = await prisma.favoriteFolder.findMany({
        where,
        include: { tags: { select: { keyName: true } }, user: { select: { name: true } } },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return c.json({ ok: true, data: folders }, StatusCodes.OK)
    } catch (error) {
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with server, try again later.' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })

  // Get all folders public
  .get('/:machineId/folders/public', optionalAuth, async (c) => {
    const user = c.get('user')
    const machineId = c.req.param('machineId')
    try {
      const whereCondition: any = {
        machineId,
      }
      if (user?.id) {
        whereCondition.userId = { not: user.id }
      }
      const folders = await prisma.favoriteFolder.findMany({
        where: whereCondition,
        include: { tags: { select: { keyName: true } }, user: { select: { name: true } }, subscriptions: true },
        orderBy: {
          createdAt: 'desc',
        },
      })
      return c.json({ ok: true, data: folders }, StatusCodes.OK)
    } catch (error) {
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with server, try again later.' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })

  // Create folder
  .post(
    '/:machineId/folders',
    requireAuth,
    zValidator('json', z.object({ name: z.string().max(16).min(3) }), validationHook),
    async (c) => {
      const userId = c.get('user').id
      const machineId = c.req.param('machineId')
      const { name } = c.req.valid('json')

      try {
        const newFolder = await prisma.favoriteFolder.create({
          data: { name, userId, machineId },
        })
        return c.json({ ok: true, data: newFolder }, 201)
      } catch (error: any) {
        if (error.code === 'P2002') {
          return c.json(
            {
              ok: false,
              error: 'Validation failed',
              details: { name: ['This folder name already exist'] },
            },
            409,
          )
        }
        return c.json<ApiErrorResponse>({ ok: false, error: 'Nepodarilo sa vytvoriť zložku. Skúste to neskôr.' }, 500)
      }
    },
  )

  // Delete folder
  .delete('/:machineId/folders/:folderId', requireAuth, async (c) => {
    try {
      const user = c.get('user')
      const machineId = c.req.param('machineId')
      const folderId = c.req.param('folderId')
      const isAdmin = user.role === ROLES.ADMIN

      const whereCondition: Prisma.FavoriteFolderWhereInput = {
        id: folderId,
        machineId: machineId,
        ...(isAdmin ? {} : { userId: user.id }),
      }
      const result = await prisma.favoriteFolder.deleteMany({
        where: whereCondition,
      })
      if (result.count === 0) {
        return c.json({ ok: false, error: `Folder id ${folderId} does not exist in db` }, StatusCodes.NOT_FOUND)
      }
      return c.json({ ok: true, message: 'Folder was successfully deleted' })
    } catch (error) {
      return c.json<ApiErrorResponse>({ ok: false, error: `Folder deleted failed` }, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  })

  // Add/Remove tag to folder
  .put('/:folderId/tags/:tagName', requireAuth, async (c) => {
    try {
      const user = c.get('user')
      const folderId = c.req.param('folderId')
      const tagName = c.req.param('tagName')
      const isAdmin = user.role === ROLES.ADMIN

      const whereCondition: Prisma.FavoriteFolderWhereInput = {
        id: folderId,
        ...(isAdmin ? {} : { userId: user.id }),
      }
      const folder = await prisma.favoriteFolder.findFirst({
        where: whereCondition,
        include: { tags: { select: { id: true, keyName: true } } },
      })

      if (!folder) {
        return c.json({ ok: false, error: 'Folder not found or access denied.' }, StatusCodes.NOT_FOUND)
      }
      const tag = await prisma.tag.findFirst({
        where: {
          keyName: tagName,
          machineId: folder.machineId,
        },
      })
      if (!tag) {
        return c.json<ApiErrorResponse>({ ok: false, error: `Tag ${tagName} was not found for this machine` }, 404)
      }
      const isContain = folder.tags.some((t) => t.keyName === tagName)
      await prisma.favoriteFolder.update({
        where: { id: folderId },
        data: {
          tags: isContain ? { disconnect: { id: tag.id } } : { connect: { id: tag.id } },
        },
      })

      const actionText = isContain ? 'removed from' : 'added to'
      return c.json({
        ok: true,
        isPinned: !isContain,
        message: `Tag '${tagName}' successfully ${actionText} folder.`,
      })
    } catch (error) {
      return c.json({ ok: false, error: 'Failed to update folder tags.' }, 500)
    }
  })

  // Add Folder to main dashboard
  .patch(
    '/:machineId/folders/:folderId/dashboard',
    requireAuth,
    zValidator('json', z.object({ showOnDashboard: z.boolean() }), validationHook),
    async (c) => {
      try {
        const userId = c.get('user').id
        const folderId = c.req.param('folderId')
        const { showOnDashboard } = c.req.valid('json')

        const updateFolder = await prisma.favoriteFolder.update({
          where: {
            id: folderId,
            userId: userId,
          },
          data: { showOnMainDashboard: showOnDashboard },
        })
        return c.json(
          {
            ok: true,
            message: showOnDashboard
              ? `Folder '${updateFolder.name}' was added do main dashboard`
              : `Folder '${updateFolder.name}' was removed from main dashboard`,
          },
          StatusCodes.CREATED,
        )
      } catch (error) {
        return c.json<ApiErrorResponse>(
          { ok: false, error: 'Problem with editing folder, try again later' },
          StatusCodes.INTERNAL_SERVER_ERROR,
        )
      }
    },
  )

  // subscribe folder (created other users)
  .post('/:machineId/folders/:folderId/subscribe', requireAuth, async (c) => {
    try {
      const userId = c.get('user').id
      const folderId = c.req.param('folderId')
      const machineId = c.req.param('machineId')

      const existingSub = await prisma.folderSubscription.findUnique({
        where: { userId_folderId: { userId, folderId } },
      })

      if (existingSub) {
        await prisma.folderSubscription.delete({
          where: { id: existingSub.id },
        })
        return c.json({ ok: true, message: 'Folder subscribe deleted', subscribed: false }, StatusCodes.OK)
      } else {
        await prisma.folderSubscription.create({
          data: { userId, folderId, machineId },
        })
        return c.json({ ok: true, message: 'Folder subscribed, check main dashboard', subscribed: true }, StatusCodes.CREATED)
      }
    } catch (error) {
      return c.json<ApiErrorResponse>(
        { ok: false, error: 'Problem with server,try again later' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      )
    }
  })

export default favorites
