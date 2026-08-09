import type EventEmitter from 'node:events'

export const temp_testSse = (plcEmitter: EventEmitter) => {
  const originalEmit = plcEmitter.emit
  plcEmitter.emit = function (event: string | symbol, ...args: any[]) {
    if (typeof event === 'string' && event.endsWith('-stream')) {
      console.log(`\n📥 [LIVE DATA] Kanál: ${event}`)
      console.log(`📊 Hodnoty:`, args[0])
    }
    return originalEmit.apply(plcEmitter, [event, ...args])
  }
}
