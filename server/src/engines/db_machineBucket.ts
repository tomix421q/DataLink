import { machineBucket } from './../globals'
import { S7Service } from './s7-service'
import type EventEmitter from 'node:events'
import type { MachineBucketItemType } from '@datalink/shared/types/collectorTypes'
import { prisma } from '../utils/db'

// Create in index.ts [use only one in index.ts] call const machineBucket from index
export class MachineBucket {
  private machineList: MachineBucketItemType[] = []
  private instances = new Map<string, S7Service>()
  private plcEmitter: EventEmitter

  constructor(plcEmitter: EventEmitter) {
    this.plcEmitter = plcEmitter
  }

  // this metod invoke when - server start or user create new machine or user adding new tags
  addMachine(machine: MachineBucketItemType) {
    // if exist
    if (this.instances.has(machine.id)) {
      console.log(`♻️ Bucket: Reload machine with id: ${machine.id}`)

      // if s7 instance exist -> stop pooling old machine (s7service remove it in stopPooling)
      const oldPlc = this.instances.get(machine.id)
      if (oldPlc) {
        oldPlc.stopPolling()
      }
      this.machineList = this.machineList.filter((m) => m.id !== machine.id)
      //
    } else {
      console.log(`🚀 Bucket: Starting new machine id:${machine.id} name:(${machine.config.plc.name})`)
    }
    this.machineList.push(machine)
    const plc = new S7Service({ config: machine.config })
    plc.connect()

    plc.startPooling((plcData, isOnline, error, tagErrors) => {
      this.plcEmitter.emit(`${machine.id}-stream`, {
        connection: { online: isOnline, machineId: machine.id, error: error, tagErrors: tagErrors || {} },
        plcData: plcData,
        info: { id: machine.id, ...machine.config },
      })
    })
    this.instances.set(machine.id, plc)
  }

  async loadFromDb() {
    console.log('⏰ Bucker: nacitavam stroje z DB...')

    const dbMachines = await prisma.machine.findMany({ include: { tags: { orderBy: { keyName: 'asc' } } } })

    dbMachines.forEach((dbMachine: any) => {
      const mappedTags: Record<string, string> = {}

      dbMachine.tags.forEach((t: any) => {
        mappedTags[t.keyName] = t.plcAddress
      })

      const bucketItem: MachineBucketItemType = {
        id: dbMachine.id,
        config: {
          plc: {
            name: dbMachine.name,
            ip: dbMachine.ip,
            rack: dbMachine.rack,
            slot: dbMachine.slot,
            interval: dbMachine.interval,
          },
          tags: mappedTags,
        },
      }
      this.addMachine(bucketItem)
    })
  }

  async loadSpecificMachineFromDb(machineId: string) {
    const dbMachine = await prisma.machine.findFirst({
      where: {
        id: machineId,
      },
      include: {
        tags: true,
      },
    })
    if (dbMachine) {
      const mappedTags: Record<string, string> = {}
      dbMachine.tags.forEach((t: any) => {
        mappedTags[t.keyName] = t.plcAddress
      })

      const bucketItem: MachineBucketItemType = {
        id: dbMachine.id,
        config: {
          plc: {
            name: dbMachine.name,
            ip: dbMachine.ip,
            rack: dbMachine.rack,
            slot: dbMachine.slot,
            interval: dbMachine.interval,
          },
          tags: mappedTags,
        },
      }
      this.addMachine(bucketItem)
    }
  }

  removeMachine(machineId: string) {
    console.log(`🛑 Bucket: Zastavujem a odstraňujem stroj ${machineId} z pamäte...`)
    const oldPlc = this.instances.get(machineId)
    if (oldPlc) {
      oldPlc.stopPolling()
    }
    this.machineList = this.machineList.filter((m) => m.id !== machineId)
    this.instances.delete(machineId)
    console.log(`✅ Bucket: Stroj ${machineId} bol úspešne odstránený.`)
  }

  getLatestData(id: string): Record<string, any> | null | undefined {
    const plc = this.instances.get(id)
    if (!plc) return null
    return plc.latestData
  }

  getMachines() {
    return this.machineList
  }
}
