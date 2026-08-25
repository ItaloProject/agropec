// @ts-nocheck
import { Elysia, t } from 'elysia'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { animais, lotes } from '../db/schema'
import { authGuard } from '../middleware/auth'

export const animaisRoutes = new Elysia({ prefix: '/animais' })
  .use(authGuard)

  .get('/', async ({ usuarioId, query }) => {
    const filtros = [eq(animais.usuarioId, usuarioId), eq(animais.status, 'ativo')]
    if (query.loteId) filtros.push(eq(animais.loteId, Number(query.loteId)))

    return db.query.animais.findMany({
      where: and(...filtros),
      with: { lote: true },
    })
  }, {
    query: t.Object({
      loteId: t.Optional(t.String()),
    }),
  })

  .post('/', async ({ usuarioId, body, set }) => {
    const lote = await db.query.lotes.findFirst({
      where: and(eq(lotes.id, body.loteId), eq(lotes.usuarioId, usuarioId)),
    })
    if (!lote) { set.status = 404; return { erro: 'Lote não encontrado' } }

    const [animal] = await db.insert(animais).values({ ...body, usuarioId }).returning()
    return animal
  }, {
    body: t.Object({
      loteId: t.Number(),
      brinco: t.Optional(t.String()),
      raca: t.Optional(t.String()),
      sexo: t.Optional(t.Union([t.Literal('macho'), t.Literal('femea')])),
      dataNascimento: t.Optional(t.String()),
      origem: t.Optional(t.Union([t.Literal('comprado'), t.Literal('nascido')])),
      valorCompra: t.Optional(t.Number()),
      pesoEntrada: t.Optional(t.Number()),
      observacao: t.Optional(t.String()),
    }),
  })
