// @ts-nocheck
import { eq, and, gte, desc } from 'drizzle-orm'
import { db } from '../db'
import {
  lotes,
  pesagens,
  registrosAlimentacao,
  eventosSaude,
  estoque,
} from '../db/schema'

export async function calcularKPIsLote(loteId: number, usuarioId: number) {
  const lote = await db.query.lotes.findFirst({
    where: and(eq(lotes.id, loteId), eq(lotes.usuarioId, usuarioId)),
  })

  if (!lote) throw new Error('Lote não encontrado')

  const ultimasPesagens = await db.query.pesagens.findMany({
    where: eq(pesagens.loteId, loteId),
    orderBy: [desc(pesagens.data)],
    limit: 2,
  })

  const ultimaPesagem = ultimasPesagens[0] ?? null
  const penultimaPesagem = ultimasPesagens[1] ?? null

  let gmdKgDia: number | null = null
  let diasConfinamento: number | null = null
  let projecaoPesoAbate: number | null = null

  if (ultimaPesagem) {
    diasConfinamento = Math.floor(
      (Date.now() - new Date(lote.dataEntrada).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (penultimaPesagem) {
      const diasEntrePesagens = Math.floor(
        (new Date(ultimaPesagem.data).getTime() - new Date(penultimaPesagem.data).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      if (diasEntrePesagens > 0) {
        gmdKgDia = (ultimaPesagem.pesoKg - penultimaPesagem.pesoKg) / diasEntrePesagens
      }
    } else if (lote.pesoMedioEntrada && diasConfinamento > 0) {
      gmdKgDia = (ultimaPesagem.pesoKg - lote.pesoMedioEntrada) / diasConfinamento
    }

    if (gmdKgDia && gmdKgDia > 0 && ultimaPesagem.pesoKg < 480) {
      const diasRestantes = (480 - ultimaPesagem.pesoKg) / gmdKgDia
      projecaoPesoAbate = diasRestantes
    }
  }

  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
  const dataCorte = trintaDiasAtras.toISOString().split('T')[0]

  const alimentacoes = await db.query.registrosAlimentacao.findMany({
    where: and(
      eq(registrosAlimentacao.loteId, loteId),
      gte(registrosAlimentacao.data, dataCorte)
    ),
  })

  const consumoRacao30Dias = alimentacoes.reduce((acc, r) => acc + r.qtdKgTotal, 0)
  const consumoRacaoDia = consumoRacao30Dias / 30
  const custoAlimentacao30Dias = alimentacoes.reduce((acc, r) => acc + (r.custoTotal ?? 0), 0)

  let conversaoAlimentar: number | null = null
  if (gmdKgDia && consumoRacaoDia && gmdKgDia > 0) {
    conversaoAlimentar = consumoRacaoDia / gmdKgDia
  }

  const mortes = await db.query.eventosSaude.findMany({
    where: and(
      eq(eventosSaude.loteId, loteId),
      eq(eventosSaude.tipo, 'morte')
    ),
  })

  const taxaMortalidade = lote.qtdInicial > 0
    ? ((lote.qtdInicial - lote.qtdAtual) / lote.qtdInicial) * 100
    : 0

  const custoPorCabecaDia = lote.qtdAtual > 0
    ? (custoAlimentacao30Dias / 30) / lote.qtdAtual
    : 0

  return {
    lote,
    pesoMedioAtual: ultimaPesagem?.pesoKg ?? lote.pesoMedioAtual,
    gmdKgDia: gmdKgDia ? parseFloat(gmdKgDia.toFixed(3)) : null,
    diasConfinamento,
    diasParaAbate: projecaoPesoAbate ? Math.ceil(projecaoPesoAbate) : null,
    consumoRacaoKgDia: parseFloat(consumoRacaoDia.toFixed(1)),
    consumoRacao30Dias: parseFloat(consumoRacao30Dias.toFixed(1)),
    conversaoAlimentar: conversaoAlimentar ? parseFloat(conversaoAlimentar.toFixed(2)) : null,
    custoAlimentacao30Dias: parseFloat(custoAlimentacao30Dias.toFixed(2)),
    custoPorCabecaDia: parseFloat(custoPorCabecaDia.toFixed(2)),
    taxaMortalidade: parseFloat(taxaMortalidade.toFixed(2)),
    totalMortes: lote.qtdInicial - lote.qtdAtual,
  }
}

export async function calcularKPIsDashboard(usuarioId: number) {
  const lotesAtivos = await db.query.lotes.findMany({
    where: and(eq(lotes.usuarioId, usuarioId), eq(lotes.ativo, true)),
  })

  const totalAnimais = lotesAtivos.reduce((acc, l) => acc + l.qtdAtual, 0)
  const totalLotes = lotesAtivos.length

  const estoqueItems = await db.query.estoque.findMany({
    where: eq(estoque.usuarioId, usuarioId),
    with: { insumo: true },
  })

  const alertasEstoque = estoqueItems.filter(e => e.qtdAtual <= e.qtdMinimaAlerta)

  const hoje = new Date().toISOString().split('T')[0]
  const alimentacoesHoje = await db.query.registrosAlimentacao.findMany({
    where: and(
      eq(registrosAlimentacao.usuarioId, usuarioId),
      eq(registrosAlimentacao.data, hoje)
    ),
  })

  const consumoHoje = alimentacoesHoje.reduce((acc, r) => acc + r.qtdKgTotal, 0)
  const custoHoje = alimentacoesHoje.reduce((acc, r) => acc + (r.custoTotal ?? 0), 0)

  return {
    totalAnimais,
    totalLotes,
    consumoRacaoHojeKg: parseFloat(consumoHoje.toFixed(1)),
    custoAlimentacaoHoje: parseFloat(custoHoje.toFixed(2)),
    alertasEstoque: alertasEstoque.length,
    insumosEmAlerta: alertasEstoque.map(e => ({
      nome: (e as any).insumo?.nome ?? 'Desconhecido',
      qtdAtual: e.qtdAtual,
      qtdMinima: e.qtdMinimaAlerta,
    })),
    especies: [...new Set(lotesAtivos.map(l => l.especie))],
  }
}
