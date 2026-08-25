import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_URL ?? 'file:agropec.db',
    authToken: process.env.TURSO_TOKEN,
  },
})
