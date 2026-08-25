// @ts-nocheck
// Importa o bundle gerado por `npm run build:api` (esbuild) em vez de
// backend/src direto: o Vercel copia os .ts do backend sem compilar e os
// imports sem extensão não resolvem em ESM. O import é estático para que
// o rastreador de dependências inclua o arquivo no pacote da função.
import { app } from './_app.js'

export const config = { maxDuration: 30 }

// O runtime Node do Vercel entrega (req, res) no estilo Node, não um
// Request/Response web. Este handler faz a ponte: monta um Request a
// partir do req, entrega ao Elysia e escreve a Response de volta no res.
// Devolver a Response sem escrever no res deixaria a requisição pendurada
// até estourar o tempo limite.

function montarHeaders(headersNode) {
  const headers = new Headers()
  for (const [nome, valor] of Object.entries(headersNode)) {
    if (valor === undefined) continue
    for (const v of Array.isArray(valor) ? valor : [valor]) headers.append(nome, v)
  }
  return headers
}

async function lerCorpo(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  const partes = []
  for await (const parte of req) partes.push(parte)
  return partes.length ? Buffer.concat(partes) : undefined
}

export default async function handler(req, res) {
  try {
    const protocolo = req.headers['x-forwarded-proto'] ?? 'https'
    const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost'
    // Remove o prefixo /api antes de repassar para o Elysia
    const caminho = (req.url || '/').replace(/^\/api/, '') || '/'

    const resposta = await app.handle(
      new Request(`${protocolo}://${host}${caminho}`, {
        method: req.method,
        headers: montarHeaders(req.headers),
        body: await lerCorpo(req),
      })
    )

    res.statusCode = resposta.status
    resposta.headers.forEach((valor, nome) => res.setHeader(nome, valor))
    res.end(Buffer.from(await resposta.arrayBuffer()))
  } catch (erro) {
    res.statusCode = 500
    res.setHeader('content-type', 'application/json')
    res.end(
      JSON.stringify(
        {
          erro: String(erro?.message ?? erro),
          origem: String(erro?.stack ?? '').split('\n').slice(1, 4),
          env: {
            TURSO_URL: Boolean(process.env.TURSO_URL),
            TURSO_TOKEN: Boolean(process.env.TURSO_TOKEN),
            JWT_SECRET: Boolean(process.env.JWT_SECRET),
          },
        },
        null,
        2
      )
    )
  }
}
