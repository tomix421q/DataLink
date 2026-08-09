import { prisma } from '../src/utils/db'

async function main() {
  console.log('Start seeding plc')
  await prisma.tag.deleteMany()
  await prisma.machine.deleteMany()

  const mf1 = await prisma.machine.create({
    data: {
      id: 'MF1',
      name: 'Middlefield machine 1',
      ip: '10.184.159.173',
      rack: 0,
      slot: 1,
      interval: 3000,
      tags: {
        create: [
          { keyName: 'Downtime', plcAddress: 'DB189,INT0' },
          { keyName: 'Tool name', plcAddress: 'DB189,S2.20' },
          { keyName: 'Machine auto', plcAddress: 'DB189,X258.0' },
          { keyName: 'Conveyor OK', plcAddress: 'DB189,X258.1' },
          { keyName: 'Step', plcAddress: 'DB189,WORD260' },
          { keyName: 'Cycle time', plcAddress: 'DB189,DINT262' },
          { keyName: 'Product count', plcAddress: 'DB189,DINT266' },
        ],
      },
    },
  })
  console.log(`✅ Stroj ${mf1.name} bol uspecne ulozeny do DB.`)

  const mf2 = await prisma.machine.create({
    data: {
      id: 'MF2',
      name: 'Middlefield machine 2',
      ip: '10.184.159.101',
      rack: 0,
      slot: 1,
      interval: 3000,
      tags: {
        create: [
          { keyName: 'Downtime', plcAddress: 'DB189,INT0' },
          { keyName: 'machineName', plcAddress: 'DB189,S2.20' },
          { keyName: 'Machine auto', plcAddress: 'DB189,X258.0' },
          { keyName: 'Conveyor OK', plcAddress: 'DB189,X258.1' },
          { keyName: 'Step', plcAddress: 'DB189,WORD260' },
          { keyName: 'Cycle time', plcAddress: 'DB189,DINT262' },
          { keyName: 'Product count', plcAddress: 'DB189,DINT266' },
        ],
      },
    },
  })
  console.log(`✅ Stroj ${mf2.name} bol uspecne ulozeny do DB.`)
}

main()
  .catch((e) => {
    console.error('❌ Chyba pri seede:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
