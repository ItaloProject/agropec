// @ts-nocheck
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

// Local dev: file:agropec.db | Production: TURSO_URL
const client = createClient(
  process.env.TURSO_URL
    ? { url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN }
    : { url: 'file:agropec.db' }
)

// PRAGMAs só fazem sentido no arquivo local; via HTTP (Turso) falham e
// derrubariam a função serverless com uma rejection não tratada no import.
if (!process.env.TURSO_URL) {
  client
    .executeMultiple('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    .catch((err) => console.error('Falha ao aplicar PRAGMAs:', err))
}

export const db = drizzle(client, { schema })
export { client as sqlite }
