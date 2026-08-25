import { app } from '../backend/src/app'

export const config = { runtime: 'edge' }

export default function handler(request: Request) {
  // Strip /api prefix before forwarding to Elysia
  const url = new URL(request.url)
  url.pathname = url.pathname.replace(/^\/api/, '') || '/'

  return app.handle(
    new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
  )
}
