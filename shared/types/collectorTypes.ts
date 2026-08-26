export interface PlcConnectType {
  name: string
  ip: string
  rack: number
  slot: number
  interval: number
}

export interface MachineBucketItemType {
  id: string
  config: {
    plc: PlcConnectType
    tags: Record<string, string>
  }
}

export interface SseMachineClient {
  connection: {
    online: boolean
    machineId: string
    error: string | null
    tagErrors: Record<string, string>
  }
  plcData: Record<string, any> | null
  info: { id: string; plc: MachineBucketItemType['config']['plc']; tags: MachineBucketItemType['config']['tags'] }
}
