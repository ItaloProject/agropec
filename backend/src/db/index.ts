// @ts-nocheck
import { createClient } from '@libsql/client/web'
import { drizzle } from 'drizzle-orm/libsql/web'
import * as schema from './schema'

// Usamos o entrypoint /web (puro HTTP) em vez do padrão: o padrão puxa o
// pacote nativo `libsql`, que quebra ao ser empacotado para serverless
// ("Dynamic require of path is not supported"). Como consequência a conexão
// é sempre remota — não há mais fallback para arquivo local.
if (!process.env.TURSO_URL) {
  throw new Error(
    'TURSO_URL não definida. Configure TURSO_URL e TURSO_TOKEN no .env (local) ou nas variáveis de ambiente do deploy.'
  )
}

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
})

export const db = drizzle(client, { schema })
export { client as sqlite }
