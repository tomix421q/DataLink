import { deleteCookie, getCookie } from 'hono/cookie'
import { prisma } from '../utils/db'
import type { User } from '../../prisma/generated/prisma/client'
import { createMiddleware } from 'hono/factory'
import { StatusCodes } from 'http-status-codes'
import { type ApiErrorResponse, type UserRole } from '@datalink/shared'

type Env = {
  Variables: {
    user: User
  }
}

// User exist check
export const requireAuth = createMiddleware<Env>(async (c, next) => {
  let token = getCookie(c, 'datalink_session_token')

  if (!token) {
    const authHeader = c.req.header('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
    return c.json<ApiErrorResponse>({ ok: false, error: 'Unauthorized' }, 401)
  }
  if (!token) c.json<ApiErrorResponse>({ ok: false, error: 'Unauthorized' }, 401)

  const session = await prisma.session.findFirst({
    where: { token, expiresAt: { gte: new Date() } },
    include: { user: true },
  })
  if (!session || !session.user) {
    if (getCookie(c, 'datalink_session_token')) {
      deleteCookie(c, 'datalink_session_token', { path: '/' })
    }
    return c.json<ApiErrorResponse>({ ok: false, error: 'Session token expired or invalid' }, 401)
  }

  c.set('user', session.user)
  await next()
})

// Role check
export const requireRole = (allowedRole: UserRole[]) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('user')

    if (!allowedRole.includes(user.role)) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'You do not have sufficient authorization' }, StatusCodes.FORBIDDEN)
    }

    await next()
  })
}
