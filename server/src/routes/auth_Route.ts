import { StatusCodes } from 'http-status-codes'
import { ROLES, type ApiErrorResponse } from '@datalink/shared'
import { Hono } from 'hono'
import { Client } from 'ldapts'
import { prisma } from '../utils/db'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { requireAuth } from '../middleware/auth'

const authRoute = new Hono()

  // Login user
  .post('/domain-login', async (c) => {
    const { username, password } = await c.req.json()
    if (!username || !password) {
      return c.json<ApiErrorResponse>({ ok: false, error: 'Name and password are required.' }, StatusCodes.BAD_REQUEST)
    }

    const client = new Client({
      url: 'ldaps://10.200.80.97:3269',
      tlsOptions: {
        rejectUnauthorized: false,
      },
    })
    const userPrincipalName = `yfco\\${username}`

    try {
      await client.bind(userPrincipalName, password)

      // User Info
      const searchResponse = await client.search('', {
        scope: 'sub',
        filter: `(sAMAccountName=${username})`,
        attributes: ['mail', 'displayName'],
      })
      await client.unbind()

      // If no info
      if (!searchResponse.searchEntries || searchResponse.searchEntries.length === 0) {
        return c.json({ ok: false, error: 'User existed, but information about it not found.' }, StatusCodes.NOT_FOUND)
      }

      // Get user info from active directory
      const ldapUser = searchResponse.searchEntries[0]
      // console.log(ldapUser)
      const realEmail = (ldapUser?.mail as string) || `${username}@yanfeng.com`
      const realName = (ldapUser?.displayName as string) || username

      if (!realEmail) {
        return c.json({ ok: false, error: 'This account not have email address in active diresctory.' }, StatusCodes.BAD_REQUEST)
      }

      // DB create
      let user = await prisma.user.findFirst({
        where: { email: realEmail },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: realName,
            email: realEmail,
            emailVerified: true,
            role: ROLES.USER,
          },
        })
      }

      // Set create and save token to db
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

      await prisma.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt: expiresAt,
          ipAddress: c.req.header('x-forwarded-for') || null,
          userAgent: c.req.header('user-agent') || null,
        },
      })

      setCookie(c, 'datalink_session_token', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: expiresAt,
        path: '/',
      })

      return c.json({ ok: true, user, token: sessionToken })
    } catch (ldapError) {
      console.error('❌ Problem with ldaps', ldapError)
      return c.json({ ok: false, error: 'Bad password/name', details: ldapError }, StatusCodes.UNAUTHORIZED)
    }
  })

  // Logout user
  .post('/logout', async (c) => {
    const sessionToken = getCookie(c, 'datalink_session_token')
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      })
    }
    deleteCookie(c, 'datalink_session_token', {
      path: '/',
    })

    return c.json({ ok: true, message: 'Logged out successfully' })
  })

  // Is active user ?
  .get('/activeuser', requireAuth, (c) => {
    const user = c.get('user')

    return c.json({ ok: true, user })
  })

export default authRoute
