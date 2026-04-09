import { createSeedDatabase } from '@/mocks/seed'
import type { AppDatabase } from '@/types/domain'

const DB_KEY = '4viso.mock.db'
const SESSION_KEY = '4viso.session.userId'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function readDatabase(): AppDatabase {
  const raw = globalThis.localStorage?.getItem(DB_KEY)

  if (!raw) {
    const seeded = createSeedDatabase()
    writeDatabase(seeded)
    return clone(seeded)
  }

  try {
    const parsed = JSON.parse(raw) as AppDatabase
    return clone(parsed)
  } catch (error) {
    console.warn('Failed to parse local database, reseeding mock data.', error)
    const seeded = createSeedDatabase()
    writeDatabase(seeded)
    return clone(seeded)
  }
}

export function writeDatabase(database: AppDatabase) {
  globalThis.localStorage?.setItem(DB_KEY, JSON.stringify(database))
}

export function resetDatabase() {
  const seeded = createSeedDatabase()
  writeDatabase(seeded)
  clearSessionUserId()
  return seeded
}

export function readSessionUserId() {
  return globalThis.localStorage?.getItem(SESSION_KEY) ?? null
}

export function writeSessionUserId(userId: string) {
  globalThis.localStorage?.setItem(SESSION_KEY, userId)
}

export function clearSessionUserId() {
  globalThis.localStorage?.removeItem(SESSION_KEY)
}
