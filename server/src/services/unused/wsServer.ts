import type { Hono } from 'hono'

export const startWsServer = (app: Hono) => {
  return Bun.serve<{ channel: string }>({
    port: Bun.env.PORT || 3000,
    fetch(req, server) {
      const url = new URL(req.url)

      if (url.pathname.startsWith('/wsstream')) {
        if (server.upgrade(req, { data: { channel: url.pathname } })) {
          return
        }
        return new Response('Upgrade failed', { status: 500 })
      }
      return app.fetch(req)
    },

    websocket: {
      open(ws) {
        ws.subscribe(ws.data.channel)
        console.log(`🖥️ Nový klient naladený na: ${ws.data.channel}`)
      },
      message(ws, msg) {
        console.log(`📩 Správa z frontendu na kanáli ${ws.data.channel}:`, msg)
      },
      close(ws) {
        ws.unsubscribe(ws.data.channel)
        console.log(`🔌 Klient odpojený z: ${ws.data.channel}`)
      },
    },
  })
}
