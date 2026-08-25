// @ts-nocheck
import { Elysia, t } from 'elysia'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { compras, fornecedores } from '../db/schema'
import { authGuard } from '../middleware/auth'
import { registrarCompra } from '../services/compras.service'

export const comprasRoutes = new Elysia({ prefix: '/compras' })
  .use(authGuard)

  .get('/', async ({ usuarioId, query }) => {
    return db.query.compras.findMany({
      where: eq(compras.usuarioId, usuarioId),
      orderBy: [desc(compras.data)],
      with: { insumo: true, fornecedor: true },
      limit: Number(query.limite ?? 50),
    })
  }, {
    query: t.Object({ limite: t.Optional(t.String()) }),
  })

  .post('/', async ({ usuarioId, body, set }) => {
    try {
      return registrarCompra({ ...body, usuarioId })
    } catch (e: any) {
      set.status = 422
      return { erro: e.message }
    }
  }, {
    body: t.Object({
      insumoId: t.Number(),
      fornecedorId: t.Optional(t.Number()),
      data: t.String(),
      quantidade: t.Number({ minimum: 0.01 }),
      valorUnitario: t.Number({ minimum: 0 }),
      notaFiscal: t.Optional(t.String()),
      observacao: t.Optional(t.String()),
    }),
  })

  .get('/fornecedores', async ({ usuarioId }) => {
    return db.query.fornecedores.findMany({
      where: eq(fornecedores.usuarioId, usuarioId),
    })
  })

  .post('/fornecedores', async ({ usuarioId, body }) => {
    const [forn] = await db.insert(fornecedores).values({ ...body, usuarioId }).returning()
    return forn
  }, {
    body: t.Object({
      nome: t.String({ minLength: 1 }),
      telefone: t.Optional(t.String()),
      email: t.Optional(t.String()),
      observacao: t.Optional(t.String()),
    }),
  })
