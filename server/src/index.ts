import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logEngine, machineBucket, sse } from './globals'
import exportRule from './routes/export_Route'
import { startDatabaseCleaner } from './jobs/dbCleaner'
import logger from './routes/logger_Route'
import { serveStatic } from 'hono/bun'
import machines from './routes/machine_Route'
import authRoute from './routes/auth_Route'
import favorites from './routes/favorite_Route'
import path from 'node:path'
import { existsSync } from 'node:fs'

export const app = new Hono()
const port = process.env.PORT ? Number(process.env.PORT) : 3333
const clientBuildPath = path.resolve(import.meta.dir, '../../client_datalink/build')
// Middleware
app.use('*', cors({ origin: (origin) => origin, credentials: true }))

// Global engines
sse.setupGlobalMachineStream(app)
await machineBucket.loadFromDb()
await logEngine.init()

// Jobs
startDatabaseCleaner()

// Temp
// const machineInfo = machineBucket.getLatestData('MF4')
// console.log(machineInfo)
// temp_testSse(plcEmitter)

// Routes
const apiRoutes = new Hono()
  .get('/hello', (c) => c.text('Hello api Hono!'))
  .route('/export', exportRule)
  .route('/logger', logger)
  .route('/machine', machines)
  .route('/auth', authRoute)
  .route('/favorite', favorites)
  .all('*', (c) => c.json({ ok: false, error: 'API route not found' }, 404))
app.route('/api', apiRoutes)

// Config load static client build, Export RPC, Export app
// app.use('*', serveStatic({ root: '../client_datalink/build' }))
app.use('*', serveStatic({ root: clientBuildPath }))
app.get('*', async (c) => {
  let indexPath = path.join(clientBuildPath, '200.html')

  if (!existsSync(indexPath)) {
    indexPath = path.join(clientBuildPath, 'index.html')
  }

  if (existsSync(indexPath)) {
    return new Response(Bun.file(indexPath), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  }

  return c.text('Frontend build not found!', 404)
})

export type AppType = typeof apiRoutes
export default { port, fetch: app.fetch }
