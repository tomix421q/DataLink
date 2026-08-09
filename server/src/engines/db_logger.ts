import type EventEmitter from 'node:events'
import type { LogRule } from '../../prisma/generated/prisma/client'
import { prisma } from '../utils/db'

type DowntimeState = {
  lastDowntimeValue: number
  form: string | null
  reason: string | null
  info: string | null
}
type RuleState = {
  rule: LogRule
  lastLoggedAt: number
  conditionMetPreviusly: boolean
  lastSeenValue?: any
  parsedTagsToSave: string[]
}

export class LogEngine {
  private emitter: EventEmitter
  private state = new Map<string, RuleState[]>()
  private stateDowntime = new Map<string, DowntimeState>()
  private subscribedMachines = new Set<string>()

  constructor(emitter: EventEmitter) {
    this.emitter = emitter
  }

  // Initial start server
  async init() {
    const machines = await prisma.machine.findMany()
    for (const machine of machines) {
      this.subscribeToMachine(machine.id)
    }

    const rules = await prisma.logRule.findMany()
    for (const rule of rules) {
      if (!this.state.has(rule.machineId)) {
        this.state.set(rule.machineId, [])
      }
      this.state.get(rule.machineId)!.push({
        rule: rule,
        lastLoggedAt: 0,
        conditionMetPreviusly: false,
        parsedTagsToSave: this.parseTags(rule.tagToSave, rule.id),
      })
    }
    console.log(`✅ LogEngine: Read ${rules.length} rules.`)
    console.log(`✅ Downtime: Read ${machines.length} to scan downtime.`)
  }

  // Cmd to register machine for checking data
  subscribeToMachine(machineId: string) {
    const eventName = `${machineId}-stream`
    if (this.subscribedMachines.has(machineId)) return
    this.subscribedMachines.add(machineId)

    this.emitter.on(eventName, (payload) => {
      this.processDataChecker(machineId, payload.plcData)
      this.processDowntimeChecker(machineId, payload.plcData)
    })
  }

  // Check if rule is fulfilled
  private async processDataChecker(machineId: string, plcData: Record<string, any> | null) {
    if (!plcData) return
    const machineRules = this.state.get(machineId)
    if (!machineRules || machineRules.length === 0) return
    const now = Date.now()

    for (const ruleState of machineRules) {
      if (ruleState.rule.triggerType === 'TIME') {
        const intervalMs = ruleState.rule.interval || 60000
        if (now - ruleState.lastLoggedAt >= intervalMs) {
          await this.saveSnapshot(machineId, ruleState.rule.id, ruleState.parsedTagsToSave, plcData)
          ruleState.lastLoggedAt = now
        }
      } else if (ruleState.rule.triggerType === 'EDGE') {
        const triggerTag = ruleState.rule.triggerTag
        const targetValue = ruleState.rule.triggerValue
        const operator = ruleState.rule.triggerOperator || '=='

        if (triggerTag && targetValue !== null && plcData[triggerTag] !== undefined) {
          const currentValue = plcData[triggerTag]
          const numCurrentValue = Number(currentValue)
          const numTargetValue = Number(targetValue)

          let isConditionMet = false
          switch (operator) {
            case '>':
              isConditionMet = numCurrentValue > numTargetValue
              break
            case '<':
              isConditionMet = numCurrentValue < numTargetValue
              break
            case '>=':
              isConditionMet = numCurrentValue >= numTargetValue
              break
            case '<=':
              isConditionMet = numCurrentValue <= numTargetValue
              break
            case '!=':
              isConditionMet = String(currentValue) !== String(targetValue)
              break
            default:
              if (typeof currentValue === 'boolean') {
                const targetBool = targetValue === 'true' || targetValue === '1'
                isConditionMet = currentValue === targetBool
              } else {
                isConditionMet = String(currentValue) === String(targetValue)
              }
              break
          }

          if (isConditionMet && !ruleState.conditionMetPreviusly) {
            await this.saveSnapshot(machineId, ruleState.rule.id, ruleState.parsedTagsToSave, plcData)
          }
          ruleState.conditionMetPreviusly = isConditionMet
        }
      } else if (ruleState.rule.triggerType === 'CHANGE') {
        const triggerTag = ruleState.rule.triggerTag
        if (triggerTag && plcData[triggerTag] !== undefined) {
          const currentValue = plcData[triggerTag]
          if (ruleState.lastSeenValue !== undefined && currentValue !== ruleState.lastSeenValue) {
            await this.saveSnapshot(machineId, ruleState.rule.id, ruleState.parsedTagsToSave, plcData)
          }
          ruleState.lastSeenValue = currentValue
        }
      }
    }
  }

  addNewRule(newRule: LogRule) {
    const machineId = newRule.machineId

    if (!this.state.has(machineId)) {
      this.state.set(machineId, [])
      this.subscribeToMachine(machineId)
      console.log(`🔌 LogEngine: Started listening new machine ${machineId} `)
    }

    this.state.get(machineId)!.push({
      rule: newRule,
      lastLoggedAt: 0,
      conditionMetPreviusly: false,
      parsedTagsToSave: this.parseTags(newRule.tagToSave, newRule.id),
    })

    console.log(`➕ LogEngine: New rule with name ${newRule.name}-${newRule.id} was added.`)
  }

  removeRuleFromRam(machineId: string, ruleId: string) {
    if (!this.state.has(machineId)) return

    const currentRules = this.state.get(machineId)!
    const filteredRules = currentRules.filter((r) => r.rule.id !== ruleId)

    this.state.set(machineId, filteredRules)
  }

  updateRuleInRam(updatedRule: LogRule) {
    const machineId = updatedRule.machineId
    if (!this.state.has(machineId)) return

    const currentRules = this.state.get(machineId)!
    const ruleState = currentRules.find((r) => r.rule.id === updatedRule.id)

    if (ruleState) {
      ruleState.rule = updatedRule
      ruleState.lastLoggedAt = 0
      ruleState.conditionMetPreviusly = false
      ruleState.lastSeenValue = undefined
      ruleState.parsedTagsToSave = this.parseTags(updatedRule.tagToSave, updatedRule.id)
    }
  }

  // Helper function to safely parse tags once
  private parseTags(jsonString: string, ruleId: string): string[] {
    try {
      return jsonString ? JSON.parse(jsonString) : []
    } catch (error) {
      console.error(`Error: Bad format tagsToSave in rules ${ruleId}`)
      return []
    }
  }
  // Helper function: Universal DB writer
  private async saveSnapshot(machineId: string, ruleId: string, tagsToSave: string[], plcData: Record<string, any>) {
    const snapshotObj: Record<string, any> = {}
    for (const tag of tagsToSave) {
      if (plcData[tag] !== undefined) {
        snapshotObj[tag] = plcData[tag]
      }
    }
    try {
      await prisma.logEntry.create({
        data: {
          machineId: machineId,
          ruleId: ruleId,
          snapshot: JSON.stringify(snapshotObj),
        },
      })
    } catch (err: any) {
      console.error(`Write error machine ${machineId} (Rule: ${ruleId})`, err)
    }
  }

  //
  // Downtime logic
  private async processDowntimeChecker(machineId: string, plcData: Record<string, any> | null) {
    if (!plcData) return

    const DOWNTIMETAG = 'Downtime'
    const FORMNAMETAG = 'formName'
    const DWREASONTAG = 'dwReason'
    const DWINFOTAG = 'Tool name'

    const currentValue = Number(plcData[DOWNTIMETAG])

    if (isNaN(currentValue)) return

    if (!this.stateDowntime.has(machineId)) {
      this.stateDowntime.set(machineId, {
        lastDowntimeValue: 0,
        form: null,
        reason: null,
        info: null,
      })
    }

    const dtState = this.stateDowntime.get(machineId)!

    if (currentValue < dtState.lastDowntimeValue) {
      const finalDowntime = dtState.lastDowntimeValue
      const isLikelyOffShift = finalDowntime >= 480
      const computedReason = isLikelyOffShift ? 'Probable not planned' : dtState.reason
      const computedInfo = isLikelyOffShift
        ? 'The machine was down for more than 8 hours, probably no production is planned on the machine.'
        : dtState.info

      prisma.downtimeLog
        .create({
          data: {
            machineId: machineId,
            duration: finalDowntime,
            form: dtState.form,
            reason: computedReason,
            info: computedInfo,
          },
        })
        .catch((err) => console.error(`❌ [Downtime] Error: downtime for machine ${machineId} has failed in write to db`, err))

      dtState.form = null
      dtState.reason = null
      dtState.info = null
    }

    if (currentValue > 0) {
      if (plcData[FORMNAMETAG] !== undefined) dtState.form = String(plcData[FORMNAMETAG])
      if (plcData[DWREASONTAG] !== undefined) dtState.reason = String(plcData[DWREASONTAG])
      if (plcData[DWINFOTAG] !== undefined) dtState.info = String(plcData[DWINFOTAG])
    }
    dtState.lastDowntimeValue = currentValue
  }
}
