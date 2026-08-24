import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { db } from './index'

console.log('⏳ Rodando migrations...')

migrate(db, { migrationsFolder: './drizzle' })

console.log('✅ Migrations concluídas.')
process.exit(0)
