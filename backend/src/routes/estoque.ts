import { Elysia, t } from 'elysia'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { estoque, insumos, movimentacoesEstoque } from '../db/schema'
import { authGuard } from '../middleware/auth'

export const estoqueRoutes = new Elysia({ prefix: '/estoque' })
  .use(authGuard)

  .get('/', async ({ usuarioId, query }) => {
    const items = await db.query.estoque.findMany({
      where: eq(estoque.usuarioId, usuarioId),
      with: { insumo: true },
    })

    if (query.alertas === 'true') {
      return items.filter(e => e.qtdAtual <= e.qtdMinimaAlerta)
    }

    return items
  }, {
    query: t.Object({ alertas: t.Optional(t.String()) }),
  })

  .post('/insumos', async ({ usuarioId, body }) => {
    const [insumo] = await db
      .insert(insumos)
      .values({ ...body, usuarioId })
      .returning()

    const [estoqueItem] = await db
      .insert(estoque)
      .values({
        usuarioId,
        insumoId: insumo.id,
        qtdAtual: body.qtdInicial ?? 0,
        qtdMinimaAlerta: body.qtdMinimaAlerta ?? 0,
      })
      .returning()

    return { insumo, estoque: estoqueItem }
  }, {
    body: t.Object({
      nome: t.String({ minLength: 1 }),
      tipo: t.String(),
      unidade: t.Optional(t.String()),
      proteínaBrutaPct: t.Optional(t.Number()),
      energiaMetab: t.Optional(t.Number()),
      custoPorUnidade: t.Optional(t.Number()),
      qtdInicial: t.Optional(t.Number()),
      qtdMinimaAlerta: t.Optional(t.Number()),
    }),
  })

  .patch('/:id', async ({ usuarioId, params, body, set }) => {
    const estoqueItem = await db.query.estoque.findFirst({
      where: and(eq(estoque.id, Number(params.id)), eq(estoque.usuarioId, usuarioId)),
    })
    if (!estoqueItem) { set.status = 404; return { erro: 'Item não encontrado' } }

    const [atualizado] = await db
      .update(estoque)
      .set({ qtdMinimaAlerta: body.qtdMinimaAlerta, atualizadoEm: new Date().toISOString() })
      .where(eq(estoque.id, Number(params.id)))
      .returning()
    return atualizado
  }, {
    body: t.Object({ qtdMinimaAlerta: t.Number({ minimum: 0 }) }),
  })

  .get('/:id/movimentacoes', async ({ usuarioId, params, query }) => {
    return db.query.movimentacoesEstoque.findMany({
      where: eq(movimentacoesEstoque.estoqueId, Number(params.id)),
      orderBy: [movimentacoesEstoque.criadoEm],
      limit: Number(query.limite ?? 50),
    })
  }, {
    query: t.Object({ limite: t.Optional(t.String()) }),
  })

  .post('/:id/ajuste', async ({ usuarioId, params, body, set }) => {
    const estoqueItem = await db.query.estoque.findFirst({
      where: and(eq(estoque.id, Number(params.id)), eq(estoque.usuarioId, usuarioId)),
    })
    if (!estoqueItem) { set.status = 404; return { erro: 'Item não encontrado' } }

    const novaQtd = estoqueItem.qtdAtual + body.quantidade
    if (novaQtd < 0) { set.status = 422; return { erro: 'Ajuste resultaria em estoque negativo' } }

    const [mov] = await db.insert(movimentacoesEstoque).values({
      estoqueId: estoqueItem.id,
      tipo: 'ajuste',
      quantidade: body.quantidade,
      qtdAntes: estoqueItem.qtdAtual,
      qtdDepois: novaQtd,
      observacao: body.observacao,
    }).returning()

    await db.update(estoque)
      .set({ qtdAtual: novaQtd, atualizadoEm: new Date().toISOString() })
      .where(eq(estoque.id, estoqueItem.id))

    return { movimentacao: mov, estoqueAtualizado: novaQtd }
  }, {
    body: t.Object({
      quantidade: t.Number(),
      observacao: t.Optional(t.String()),
    }),
  })
