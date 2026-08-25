// @ts-nocheck
export const config = { maxDuration: 30 }

// O import do app é feito dentro do handler para que uma falha de
// carregamento vire uma resposta legível em vez de FUNCTION_INVOCATION_FAILED.
let appPromise

export default async function handler(request: Request) {
  try {
    appPromise ??= import('../backend/src/app').then((m) => m.app)
    const app = await appPromise

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
  } catch (erro) {
    return new Response(
      JSON.stringify(
        {
          erro: String(erro?.message ?? erro),
          stack: String(erro?.stack ?? '').split('\n').slice(0, 8),
          temTursoUrl: Boolean(process.env.TURSO_URL),
          temTursoToken: Boolean(process.env.TURSO_TOKEN),
          temJwtSecret: Boolean(process.env.JWT_SECRET),
        },
        null,
        2
      ),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
