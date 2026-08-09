import type { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type EventEmitter from 'node:events'

export class SseStreamer {
  private emitter: EventEmitter

  constructor(emitter: EventEmitter) {
    this.emitter = emitter
    this.startWatchdog()
  }

  private startWatchdog() {
    setInterval(() => {
      const events = this.emitter.eventNames()
      let totalClients = 0

      console.log(`\n📊 --- [SSE Metrics] ---`)

      for (const ev of events) {
        if (typeof ev === 'string' && ev.endsWith('-stream')) {
          const count = this.emitter.listenerCount(ev)
          totalClients += count

          if (count > 0) {
            console.log(`   👉 ${ev}: ${count} active client`)
          }
        }
      }
      console.log(`   Sum connected: ${totalClients}`)
      console.log(`------------------------\n`)
    }, 60000 * 60)
  }

  // Server start
  setupGlobalMachineStream(app: Hono) {
    // Sse route
    app.get('/api/sse/:id', (c) => {
      const machineId = c.req.param('id')

      // Event name
      const eventName = `${machineId}-stream`
      return streamSSE(c, async (stream) => {
        const onPlcUpdate = async (data: any) => {
          await stream.writeSSE({ data: JSON.stringify(data) })
        }

        // Connect listener to event
        this.emitter.on(eventName, onPlcUpdate)

        // IF user close window
        stream.onAbort(() => {
          this.emitter.off(eventName, onPlcUpdate)
        })

        try {
          while (true) {
            await stream.sleep(3000)
            await stream.writeSSE({ event: 'ping', data: 'heartbeat' })
          }
        } catch (error) {
        } finally {
          this.emitter.off(eventName, onPlcUpdate)
        }
      })
    })
  }
}
