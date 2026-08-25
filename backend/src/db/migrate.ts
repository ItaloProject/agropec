import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './index'

console.log('⏳ Rodando migrations...')

await migrate(db, { migrationsFolder: './drizzle' })

console.log('✅ Migrations concluídas.')
process.exit(0)
