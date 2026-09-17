import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient, type Client } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./db/dev.db'

  // If DATABASE_URL starts with "libsql://" or "https://", use the Turso adapter
  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
    try {
      const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN
      const libsql: Client = createClient({
        url: dbUrl,
        ...(authToken ? { authToken } : {}),
      })
      const adapter = new PrismaLibSql(libsql)
      console.log(`[DB] Connected to Turso: ${dbUrl.substring(0, 30)}...`)
      return new PrismaClient({ adapter })
    } catch (error) {
      console.error('[DB] Turso connection failed, falling back to SQLite:', error)
      // Fall through to SQLite
    }
  }

  // Local development: use regular SQLite
  try {
    console.log(`[DB] Connected to SQLite: ${dbUrl}`)
    return new PrismaClient()
  } catch (error) {
    console.error('[DB] SQLite connection failed:', error)
    // Last resort — return a basic client. Queries will fail but imports won't crash.
    return new PrismaClient()
  }
}

let db: PrismaClient

try {
  db = globalForPrisma.prisma ?? createPrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
} catch (error) {
  console.error('[DB] Fatal error creating Prisma client:', error)
  try {
    db = new PrismaClient()
  } catch {
    // If even this fails, create a proxy that throws on any access
    // but allows the module to be imported without crashing
    console.error('[DB] Cannot create any PrismaClient — app will have DB errors')
    db = null as unknown as PrismaClient
  }
}

export { db }
