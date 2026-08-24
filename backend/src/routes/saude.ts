import { Elysia, t } from 'elysia'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { eventosSaude, lotes, animais } from '../db/schema'
import { authGuard } from '../middleware/auth'

export const saudeRoutes = new Elysia({ prefix: '/saude' })
  .use(authGuard)

  .get('/', async ({ usuarioId, query }) => {
    const filtros = [eq(eventosSaude.usuarioId, usuarioId)]
    if (query.loteId) filtros.push(eq(eventosSaude.loteId, Number(query.loteId)))
    if (query.tipo) filtros.push(eq(eventosSaude.tipo, query.tipo as any))

    return db.query.eventosSaude.findMany({
      where: and(...filtros),
      orderBy: [desc(eventosSaude.data)],
      with: { lote: true },
      limit: Number(query.limite ?? 50),
    })
  }, {
    query: t.Object({
      loteId: t.Optional(t.String()),
      tipo: t.Optional(t.String()),
      limite: t.Optional(t.String()),
    }),
  })

  .post('/', async ({ usuarioId, body, set }) => {
    if (body.tipo === 'morte' && body.loteId) {
      const lote = await db.query.lotes.findFirst({
        where: and(eq(lotes.id, body.loteId), eq(lotes.usuarioId, usuarioId)),
      })
      if (!lote) { set.status = 404; return { erro: 'Lote não encontrado' } }
      if (lote.qtdAtual <= 0) { set.status = 422; return { erro: 'Lote já está com 0 animais' } }

      await db.update(lotes)
        .set({ qtdAtual: lote.qtdAtual - 1 })
        .where(eq(lotes.id, body.loteId))

      if (body.animalId) {
        await db.update(animais)
          .set({ status: 'morto' })
          .where(eq(animais.id, body.animalId))
      }
    }

    const [evento] = await db.insert(eventosSaude).values({ ...body, usuarioId }).returning()
    return evento
  }, {
    body: t.Object({
      loteId: t.Optional(t.Number()),
      animalId: t.Optional(t.Number()),
      tipo: t.String(),
      data: t.String(),
      produto: t.Optional(t.String()),
      doseQtd: t.Optional(t.Number()),
      unidadeDose: t.Optional(t.String()),
      custo: t.Optional(t.Number()),
      causaMortis: t.Optional(t.String()),
      observacao: t.Optional(t.String()),
    }),
  })
