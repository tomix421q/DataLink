import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../utils/db'

const MAX_BACKUP_AGE_DAYS = 14 // Počet dní držania záloh

async function cleanupOldBackups(backupDir: string) {
  const now = Date.now()
  const maxAgeMs = MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000
  const files = fs.readdirSync(backupDir)

  for (const file of files) {
    if (file.startsWith('backup-') && file.endsWith('.db')) {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath)
        console.log(`🧹 Zmazaná stará záloha: ${file}`)
      }
    }
  }
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(__dirname, '../../backups')

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const backupPath = path.resolve(backupDir, `backup-${timestamp}.db`).replaceAll('\\', '/')

  try {
    await prisma.$executeRawUnsafe(`VACUUM INTO '${backupPath}'`)
    console.log(`✅ Záloha úspešne vytvorená: ${backupPath}`)

    cleanupOldBackups(backupDir)
  } catch (error) {
    console.error('❌ Chyba pri vytváraní zálohy:', error)
    process.exit(1) // Oznámi Task Scheduleru zlyhanie úlohy
  } finally {
    await prisma.$disconnect()
  }
}

runBackup()
