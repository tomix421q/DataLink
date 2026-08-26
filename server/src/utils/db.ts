import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../prisma/generated/prisma/client'

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error('❌ DATABASE_URL is missing!')
}
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const adapter = new PrismaLibSql({
  url: url,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

// 2. Nastavenie SQLite PRAGMA pri štarte (Top-Level await v Bune)
// if (url.startsWith('file:')) {
//   await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
//   await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;')
// }
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
