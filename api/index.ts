// @ts-nocheck
import { app } from '../backend/src/app'

export const config = { maxDuration: 30 }

export default async function handler(request: Request) {
  // Remove o prefixo /api antes de repassar para o Elysia
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(/^\/api/, '') || '/'

  // Lê o corpo por completo: repassar o stream direto exigiria duplex
  // half-open, que o runtime Node do Vercel não aceita.
  const temCorpo = request.method !== 'GET' && request.method !== 'HEAD'
  const body = temCorpo ? await request.arrayBuffer() : undefined

  return app.handle(
    new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body,
    })
  )
}
