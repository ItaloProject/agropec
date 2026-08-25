// @ts-nocheck
import { eq, and } from 'drizzle-orm'
import { db, sqlite } from '../db'
import {
  registrosAlimentacao,
  estoque,
  movimentacoesEstoque,
  lotes,
  insumos,
  type Turno,
} from '../db/schema'

interface RegistrarAlimentacaoInput {
  usuarioId: number
  loteId: number
  insumoId: number
  data: string
  turno: Turno
  qtdKgTotal: number
  observacao?: string
}

interface RegistrarAlimentacaoResult {
  registro: typeof registrosAlimentacao.$inferSelect
  estoqueAtualizado: number
  alertaBaixoEstoque: boolean
}

export async function registrarAlimentacao(
  input: RegistrarAlimentacaoInput
): Promise<RegistrarAlimentacaoResult> {
  const lote = await db.query.lotes.findFirst({
    where: and(eq(lotes.id, input.loteId), eq(lotes.usuarioId, input.usuarioId)),
  })

  if (!lote) throw new Error('Lote não encontrado')
  if (!lote.ativo) throw new Error('Lote inativo')

  const estoqueItem = await db.query.estoque.findFirst({
    where: and(
      eq(estoque.insumoId, input.insumoId),
      eq(estoque.usuarioId, input.usuarioId)
    ),
  })

  if (!estoqueItem) throw new Error('Insumo não encontrado no estoque')

  if (estoqueItem.qtdAtual < input.qtdKgTotal) {
    throw new Error(
      `Estoque insuficiente. Disponível: ${estoqueItem.qtdAtual.toFixed(1)} kg. Necessário: ${input.qtdKgTotal} kg`
    )
  }

  const insumo = await db.query.insumos.findFirst({
    where: eq(insumos.id, input.insumoId),
  })

  const qtdPorCabeca = input.qtdKgTotal / lote.qtdAtual
  const custoTotal = insumo?.custoPorUnidade
    ? input.qtdKgTotal * insumo.custoPorUnidade
    : null

  const novaQtd = estoqueItem.qtdAtual - input.qtdKgTotal

  const resultado = db.transaction((tx) => {
    const [registro] = tx
      .insert(registrosAlimentacao)
      .values({
        loteId: input.loteId,
        insumoId: input.insumoId,
        usuarioId: input.usuarioId,
        data: input.data,
        turno: input.turno,
        qtdKgTotal: input.qtdKgTotal,
        qtdKgPorCabeca: qtdPorCabeca,
        qtdAnimais: lote.qtdAtual,
        custoTotal,
        observacao: input.observacao,
      })
      .returning()
      .all()

    const [movimentacao] = tx
      .insert(movimentacoesEstoque)
      .values({
        estoqueId: estoqueItem.id,
        tipo: 'saida_alimentacao',
        quantidade: -input.qtdKgTotal,
        qtdAntes: estoqueItem.qtdAtual,
        qtdDepois: novaQtd,
        referenciaId: registro.id,
        observacao: `Alimentação lote: ${lote.nome} | Turno: ${input.turno}`,
      })
      .returning()
      .all()

    tx.update(estoque)
      .set({
        qtdAtual: novaQtd,
        atualizadoEm: new Date().toISOString(),
      })
      .where(eq(estoque.id, estoqueItem.id))
      .run()

    tx.update(registrosAlimentacao)
      .set({ movimentacaoEstoqueId: movimentacao.id })
      .where(eq(registrosAlimentacao.id, registro.id))
      .run()

    return registro
  })

  return {
    registro: resultado,
    estoqueAtualizado: novaQtd,
    alertaBaixoEstoque: novaQtd <= estoqueItem.qtdMinimaAlerta,
  }
}
