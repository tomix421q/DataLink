// services/cognex-service.ts
import { z } from 'zod'

export class CognexService<T extends z.ZodType> {
  private schema: T
  private config: { ip: string; port: number }

  constructor({ config, schema }: { config: { ip: string; port: number }; schema: T }) {
    this.config = config
    this.schema = schema
  }

  async getResult() {

    const socket = await Bun.connect({
      hostname: this.config.ip,
      port: this.config.port,
      socket: {
        data(socket, data) {
          const rawResponse = data.toString()
          // Tu by si spracoval odpoveď z kamery
          console.log('Kamera poslala:', rawResponse)
        },
      },
    })
  }
}
