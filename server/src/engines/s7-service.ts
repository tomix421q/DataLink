import type { PlcConnectType } from '@datalink/shared/types/collectorTypes'
import nodes7 from 'nodes7'

export class S7Service {
  private conn: any
  private isReady = false
  private isConnecting = false
  private isDestroyed = false
  private timer?: NodeJS.Timeout
  private reconnectTimeout?: NodeJS.Timeout
  private config: { plc: PlcConnectType; tags: Record<string, string> }
  private _latestData: Record<string, any> = {}
  private _lastError: string | null = null

  constructor({ config }: { config: { plc: PlcConnectType; tags: Record<string, string> } }) {
    this.conn = new nodes7({ silent: true })
    this.config = config
  }

  connect() {
    if (this.isDestroyed || this.isConnecting || this.isReady) return
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    this.isConnecting = true
    const { ip, rack, slot, name } = this.config.plc
    const tagNames = Object.keys(this.config.tags)
    if (tagNames.length > 0) {
      this.conn.setTranslationCB((tag: string) => {
        return this.config.tags![tag as string]
      })
    }

    this.conn.initiateConnection({ port: 102, host: ip, rack, slot }, (err: any) => {
      this.isConnecting = false
      if (this.isDestroyed) {
        this.conn.dropConnection()
        return
      }
      if (err) {
        // console.error(`❌ PLC Spojenie zlyhalo (${name} - ${ip}): ${err.code || err}`)
        this._lastError = err.code || err.toString()
        this.isReady = false
        this.reconnectTimeout = setTimeout(() => this.connect(), 10000)
        // console.warn(`⏳ [${name}] Skúšam znovupripojenie o 10 sekúnd...`)
        return
      }
      // console.log(`Plc connected: Ip:${ip} Name:${name}`)
      this._lastError = null
      if (tagNames.length > 0) {
        this.conn.addItems(tagNames)
      }
      this.isReady = true
    })
  }

  startPooling(onUpdate: (data: any | null, online: boolean, error: string | null) => void) {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      if (!this.isReady) {
        onUpdate(null, false, this._lastError || 'NOT_READY')
        return
      }

      if (Object.keys(this.config.tags).length === 0) {
        onUpdate({}, true, null)
        return
      }

      this.conn.readAllItems((err: any, values: any) => {
        if (this.isDestroyed) return
        if (err || !values) {
          this._lastError = err?.code || 'READ_ERROR'
          this.isReady = false
          this.conn.dropConnection()
          this.connect()
          onUpdate(null, false, this._lastError)
          return
        }
        this._lastError = null
        this._latestData = values
        onUpdate(values, true, null)
      })
    }, this.config.plc.interval)
  }

  stopPolling() {
    this.isDestroyed = true
    if (this.timer) {
      clearInterval(this.timer)
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
    this.conn.dropConnection()
    this.isReady = false
  }

  get lastError(): string | null {
    return this._lastError
  }

  get latestData(): Record<string, any> {
    return this._latestData
  }

  get online(): boolean {
    return this.isReady
  }
}
