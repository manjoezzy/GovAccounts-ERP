import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient, type Client } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./db/dev.db'

  try {
    // If DATABASE_URL starts with "libsql://" or "https://", use the Turso adapter
    if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
      const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN
      const libsql: Client = createClient({
        url: dbUrl,
        ...(authToken ? { authToken } : {}),
      })
      const adapter = new PrismaLibSql(libsql)
      console.log(`[DB] Connected to Turso: ${dbUrl.substring(0, 30)}...`)
      return new PrismaClient({ adapter })
    }

    // Local development: use regular SQLite
    console.log(`[DB] Connected to SQLite: ${dbUrl}`)
    return new PrismaClient()
  } catch (error) {
    console.error('[DB] Failed to create Prisma client:', error)
    // Return a basic client as fallback — will fail on queries but won't crash import
    return new PrismaClient()
  }
}

let db: PrismaClient

try {
  db = globalForPrisma.prisma ?? createPrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
} catch (error) {
  console.error('[DB] Fatal error creating Prisma client:', error)
  db = new PrismaClient()
}

export { db }
