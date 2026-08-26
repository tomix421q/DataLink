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
  private _tagErrors: Record<string, string> = {}

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

  startPooling(onUpdate: (data: any | null, online: boolean, error: string | null, tagErrors?: Record<string, string>) => void) {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      if (!this.isReady) {
        onUpdate(null, false, this._lastError || 'NOT_READY', this._tagErrors)
        return
      }
      const registeredTags = Object.keys(this.config.tags)
      if (registeredTags.length === 0) {
        onUpdate({}, true, null, {})
        return
      }

      this.conn.readAllItems((err: any, values: any) => {
        if (this.isDestroyed) return
        if (err && (!values || Object.keys(values).length === 0)) {
          const isNetworkError =
            err.code === 'EPIPE' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.toString().includes('timeout')

          if (isNetworkError) {
            this._lastError = err?.code || 'NETWORK_ERROR'
            this.isReady = false
            this.conn.dropConnection(() => {})
            this.connect()
            onUpdate(null, false, this._lastError, this._tagErrors)
            return
          }
        }
        this._lastError = null
        const currentData: Record<string, any> = {}
        const currentTagErrors: Record<string, string> = {}
        for (const tag of registeredTags) {
          const val = values ? values[tag] : undefined
          const isBadValue = val === undefined || val === null || (typeof val === 'string' && val.startsWith('BAD'))

          if (isBadValue) {
            currentTagErrors[tag] = typeof val === 'string' ? val : 'BAD_ADDRESS_OR_MISSING'
          } else {
            currentData[tag] = val
          }
        }
        this._latestData = currentData
        this._tagErrors = currentTagErrors

        const hasRegisteredTags = registeredTags.length > 0
        const hasZeroValidData = Object.keys(currentData).length === 0
        if (hasRegisteredTags && hasZeroValidData) {
          this._lastError = 'COMMUNICATION_LOST_OR_OFFLINE'
          this.isReady = false
          this.conn.dropConnection(() => {})
          this.connect()
          onUpdate(null, false, this._lastError, currentTagErrors)
          return
        }

        onUpdate(currentData, true, null, currentTagErrors)
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

  get tagErrors(): Record<string, string> {
    return this._tagErrors
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
