import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../../prisma/generated/prisma/client'

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error('❌ DATABASE_URL is missing!')
}

const adapter = new PrismaLibSql({
  url: url ?? '',
})

export const prisma = new PrismaClient({ adapter })
