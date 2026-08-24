import { Elysia, t } from 'elysia'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { lotes } from '../db/schema'
import { authGuard } from '../middleware/auth'
import { calcularKPIsLote } from '../services/kpi.service'

export const lotesRoutes = new Elysia({ prefix: '/lotes' })
  .use(authGuard)

  .get('/', async ({ usuarioId, query }) => {
    const filtros = [eq(lotes.usuarioId, usuarioId)]
    if (query.ativo !== undefined) filtros.push(eq(lotes.ativo, query.ativo === 'true'))
    if (query.especie) filtros.push(eq(lotes.especie, query.especie as any))

    return db.query.lotes.findMany({
      where: and(...filtros),
      orderBy: [desc(lotes.criadoEm)],
    })
  }, {
    query: t.Object({
      ativo: t.Optional(t.String()),
      especie: t.Optional(t.String()),
    }),
  })

  .get('/:id/kpis', async ({ usuarioId, params, set }) => {
    try {
      return calcularKPIsLote(Number(params.id), usuarioId)
    } catch (e: any) {
      set.status = 404
      return { erro: e.message }
    }
  })

  .post('/', async ({ usuarioId, body }) => {
    const [lote] = await db
      .insert(lotes)
      .values({ ...body, usuarioId, qtdAtual: body.qtdInicial })
      .returning()
    return lote
  }, {
    body: t.Object({
      nome: t.String({ minLength: 1 }),
      codigo: t.Optional(t.String()),
      especie: t.String(),
      finalidade: t.Optional(t.String()),
      fase: t.Optional(t.String()),
      localizacao: t.Optional(t.String()),
      qtdInicial: t.Number({ minimum: 1 }),
      dataEntrada: t.String(),
      pesoMedioEntrada: t.Optional(t.Number()),
      observacao: t.Optional(t.String()),
    }),
  })

  .patch('/:id', async ({ usuarioId, params, body, set }) => {
    const lote = await db.query.lotes.findFirst({
      where: and(eq(lotes.id, Number(params.id)), eq(lotes.usuarioId, usuarioId)),
    })
    if (!lote) { set.status = 404; return { erro: 'Lote não encontrado' } }

    const [atualizado] = await db
      .update(lotes)
      .set(body)
      .where(eq(lotes.id, Number(params.id)))
      .returning()
    return atualizado
  }, {
    body: t.Partial(t.Object({
      nome: t.String(),
      codigo: t.String(),
      finalidade: t.String(),
      fase: t.String(),
      localizacao: t.String(),
      pesoMedioAtual: t.Number(),
      qtdAtual: t.Number(),
      ativo: t.Boolean(),
      observacao: t.String(),
    })),
  })

  .delete('/:id', async ({ usuarioId, params, set }) => {
    const lote = await db.query.lotes.findFirst({
      where: and(eq(lotes.id, Number(params.id)), eq(lotes.usuarioId, usuarioId)),
    })
    if (!lote) { set.status = 404; return { erro: 'Lote não encontrado' } }

    await db.update(lotes).set({ ativo: false }).where(eq(lotes.id, Number(params.id)))
    return { sucesso: true }
  })
