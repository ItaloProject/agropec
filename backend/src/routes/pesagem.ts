// @ts-nocheck
import { Elysia, t } from 'elysia'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db'
import { pesagens, lotes, animais } from '../db/schema'
import { authGuard } from '../middleware/auth'

export const pesagemRoutes = new Elysia({ prefix: '/pesagens' })
  .use(authGuard)

  .get('/', async ({ usuarioId, query }) => {
    const filtros = [eq(pesagens.usuarioId, usuarioId)]
    if (query.loteId) filtros.push(eq(pesagens.loteId, Number(query.loteId)))

    return db.query.pesagens.findMany({
      where: and(...filtros),
      orderBy: [desc(pesagens.data), desc(pesagens.criadoEm)],
      with: { lote: true, animal: true },
      limit: Number(query.limite ?? 100),
    })
  }, {
    query: t.Object({
      loteId: t.Optional(t.String()),
      limite: t.Optional(t.String()),
    }),
  })

  .post('/', async ({ usuarioId, body, set }) => {
    const lote = await db.query.lotes.findFirst({
      where: and(eq(lotes.id, body.loteId), eq(lotes.usuarioId, usuarioId)),
    })
    if (!lote) { set.status = 404; return { erro: 'Lote não encontrado' } }

    let animal: typeof animais.$inferSelect | undefined
    if (body.animalId) {
      animal = await db.query.animais.findFirst({
        where: eq(animais.id, body.animalId),
      })
    }

    const ultimaPesagem = await db.query.pesagens.findFirst({
      where: body.animalId
        ? and(eq(pesagens.animalId, body.animalId), eq(pesagens.usuarioId, usuarioId))
        : and(eq(pesagens.loteId, body.loteId), eq(pesagens.usuarioId, usuarioId)),
      orderBy: [desc(pesagens.data), desc(pesagens.criadoEm)],
    })

    let gmdGDia: number | null = null
    let variacaoPct: number | null = null
    let diasDesde: number | null = null

    const pesoRef = ultimaPesagem?.pesoKg ?? (body.animalId ? animal?.pesoEntrada : lote.pesoMedioEntrada)
    const dataRef = ultimaPesagem?.data ?? lote.dataEntrada

    if (pesoRef && dataRef) {
      diasDesde = Math.floor(
        (new Date(body.data).getTime() - new Date(dataRef).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diasDesde > 0) {
        gmdGDia = ((body.pesoKg - pesoRef) / diasDesde) * 1000
        variacaoPct = ((body.pesoKg - pesoRef) / pesoRef) * 100
      }
    }

    const [pesagem] = await db.insert(pesagens).values({
      ...body,
      usuarioId,
      gmdGDia,
      variacaoPct,
      diasDesdeUltimaPesagem: diasDesde,
    }).returning()

    if (!body.animalId) {
      // Pesagem de lote: atualiza peso médio diretamente
      await db.update(lotes)
        .set({ pesoMedioAtual: body.pesoKg })
        .where(eq(lotes.id, body.loteId))
    } else {
      // Pesagem individual: recalcula média do lote a partir dos últimos pesos por animal
      const animaisDoLote = await db.query.animais.findMany({
        where: and(eq(animais.loteId, body.loteId), eq(animais.status, 'ativo')),
      })

      const pesos: number[] = []
      for (const a of animaisDoLote) {
        const ultima = await db.query.pesagens.findFirst({
          where: and(eq(pesagens.animalId, a.id), eq(pesagens.usuarioId, usuarioId)),
          orderBy: [desc(pesagens.data), desc(pesagens.criadoEm)],
        })
        if (ultima) pesos.push(ultima.pesoKg)
        else if (a.pesoEntrada) pesos.push(a.pesoEntrada)
      }

      if (pesos.length > 0) {
        const media = pesos.reduce((s, p) => s + p, 0) / pesos.length
        await db.update(lotes)
          .set({ pesoMedioAtual: media })
          .where(eq(lotes.id, body.loteId))
      }
    }

    return pesagem
  }, {
    body: t.Object({
      loteId: t.Number(),
      animalId: t.Optional(t.Number()),
      data: t.String(),
      pesoKg: t.Number({ minimum: 0.1 }),
      qtdPesada: t.Optional(t.Number()),
      responsavel: t.Optional(t.String()),
      observacao: t.Optional(t.String()),
    }),
  })
