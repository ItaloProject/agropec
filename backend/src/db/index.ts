import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

// Local dev: file:agropec.db | Production: TURSO_URL
const client = createClient(
  process.env.TURSO_URL
    ? { url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN }
    : { url: 'file:agropec.db' }
)

client.executeMultiple('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

export const db = drizzle(client, { schema })
export { client as sqlite }
