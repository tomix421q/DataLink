import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../utils/db'

// TODO: add to win sheduler in winserver
async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(__dirname, '../backups')

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupPath = path.resolve(backupDir, `backup-${timestamp}.db`)

  try {
    // 🔑 Magický SQL príkaz, ktorý bezpečne skopíruje živú DB za behu
    await prisma.$executeRawUnsafe(`VACUUM INTO '${backupPath}'`)
    console.log(`✅ Záloha úspešne vytvorená: ${backupPath}`)
  } catch (error) {
    console.error('❌ Chyba pri vytváraní zálohy:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runBackup()
