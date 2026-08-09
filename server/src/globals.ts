import EventEmitter from 'node:events'
import { MachineBucket } from './engines/db_machineBucket'
import { LogEngine } from './engines/db_logger'
import { SseStreamer } from './services/basic/sse-streamer'

export const plcEmitter = new EventEmitter()
plcEmitter.setMaxListeners(130)

export const machineBucket = new MachineBucket(plcEmitter)
export const logEngine = new LogEngine(plcEmitter)
export const sse = new SseStreamer(plcEmitter)
