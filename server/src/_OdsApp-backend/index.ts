import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import path from 'node:path'
import { UPLOAD_ROOT } from './odsStorage'

export const odsApp = new Hono()

const odsBuildPath = path.resolve(import.meta.dir, '../../../client_ods/dist')

// 1. ODS Uploads (Servovanie PDF a príloh)
odsApp.get('/uploads/*', async (c) => {
  const rawPath = c.req.path.replace(/^\/uploads\/?/, '')
  const relativePath = decodeURIComponent(rawPath)
  const filePath = path.resolve(UPLOAD_ROOT, relativePath)

  const file = Bun.file(filePath)
  const exists = await file.exists()
  if (!exists) {
    return c.text(`File not found: ${relativePath}`, 404)
  }

  return new Response(file, {
    headers: {
      'Content-Type': filePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' : file.type || 'application/octet-stream',
      'Content-Disposition': 'inline',
    },
  })
})

// 2. React Frontend (Statické assets + SPA fallback)
odsApp.use(
  '/ods/*',
  serveStatic({
    root: odsBuildPath,
    rewriteRequestPath: (path) => path.replace(/^\/ods/, ''),
  }),
)
odsApp.get('/ods/*', serveStatic({ path: path.join(odsBuildPath, 'index.html') }))
