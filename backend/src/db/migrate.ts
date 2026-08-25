// @ts-nocheck
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './index'

console.log('â³ Rodando migrations...')

await migrate(db, { migrationsFolder: './drizzle' })

console.log('âœ… Migrations concluÃ­das.')
process.exit(0)
