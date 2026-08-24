import { Elysia, t } from 'elysia'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { db } from '../db'
import { registrosAlimentacao, dietas } from '../db/schema'
import { authGuard } from '../middleware/auth'
import { registrarAlimentacao } from '../services/alimentacao.service'


export const alimentacaoRoutes = new Elysia({ prefix: '/alimentacao' })
  .use(authGuard)

  .post('/', async ({ usuarioId, body, set }) => {
    try {
      const resultado = await registrarAlimentacao({ ...body, usuarioId })

      return {
        registro: resultado.registro,
        estoqueRestante: resultado.estoqueAtualizado,
        alerta: resultado.alertaBaixoEstoque
          ? '⚠️ Estoque abaixo do mínimo configurado!'
          : null,
      }
    } catch (e: any) {
      set.status = 422
      return { erro: e.message }
    }
  }, {
    body: t.Object({
      loteId: t.Number(),
      insumoId: t.Number(),
      data: t.String(),
      turno: t.Union([t.Literal('manha'), t.Literal('tarde'), t.Literal('noite')]),
      qtdKgTotal: t.Number({ minimum: 0.1 }),
      observacao: t.Optional(t.String()),
    }),
  })

  .get('/', async ({ usuarioId, query }) => {
    const filtros = [eq(registrosAlimentacao.usuarioId, usuarioId)]
    if (query.loteId) filtros.push(eq(registrosAlimentacao.loteId, Number(query.loteId)))
    if (query.dataInicio) filtros.push(gte(registrosAlimentacao.data, query.dataInicio))
    if (query.dataFim) filtros.push(lte(registrosAlimentacao.data, query.dataFim))

    return db.query.registrosAlimentacao.findMany({
      where: and(...filtros),
      orderBy: [desc(registrosAlimentacao.data), desc(registrosAlimentacao.criadoEm)],
      with: { lote: true, insumo: true },
      limit: Number(query.limite ?? 100),
    })
  }, {
    query: t.Object({
      loteId: t.Optional(t.String()),
      dataInicio: t.Optional(t.String()),
      dataFim: t.Optional(t.String()),
      limite: t.Optional(t.String()),
    }),
  })

  .get('/dietas', async ({ usuarioId, query }) => {
    return db.query.dietas.findMany({
      where: query.loteId
        ? and(eq(dietas.loteId, Number(query.loteId)), eq(dietas.ativo, true))
        : eq(dietas.ativo, true),
      with: { insumo: true, lote: true },
    })
  }, {
    query: t.Object({ loteId: t.Optional(t.String()) }),
  })

  .post('/dietas', async ({ usuarioId, body }) => {
    const [dieta] = await db.insert(dietas).values(body).returning()
    return dieta
  }, {
    body: t.Object({
      loteId: t.Number(),
      insumoId: t.Number(),
      turno: t.Union([t.Literal('manha'), t.Literal('tarde'), t.Literal('noite')]),
      qtdKgPorCabeca: t.Number({ minimum: 0.001 }),
    }),
  })

  .delete('/dietas/:id', async ({ params, set }) => {
    const [atualizado] = await db
      .update(dietas)
      .set({ ativo: false })
      .where(eq(dietas.id, Number(params.id)))
      .returning()
    if (!atualizado) { set.status = 404; return { erro: 'Dieta não encontrada' } }
    return { sucesso: true }
  })
