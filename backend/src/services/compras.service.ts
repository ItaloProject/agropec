import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { compras, estoque, movimentacoesEstoque, insumos } from '../db/schema'

interface RegistrarCompraInput {
  usuarioId: number
  insumoId: number
  fornecedorId?: number
  data: string
  quantidade: number
  valorUnitario: number
  notaFiscal?: string
  observacao?: string
}

export async function registrarCompra(input: RegistrarCompraInput) {
  const estoqueItem = await db.query.estoque.findFirst({
    where: and(
      eq(estoque.insumoId, input.insumoId),
      eq(estoque.usuarioId, input.usuarioId)
    ),
  })

  if (!estoqueItem) throw new Error('Insumo não encontrado no estoque. Cadastre o insumo primeiro.')

  const valorTotal = input.quantidade * input.valorUnitario
  const novaQtd = estoqueItem.qtdAtual + input.quantidade

  const resultado = db.transaction((tx) => {
    const [compra] = tx
      .insert(compras)
      .values({
        usuarioId: input.usuarioId,
        insumoId: input.insumoId,
        fornecedorId: input.fornecedorId,
        data: input.data,
        quantidade: input.quantidade,
        valorUnitario: input.valorUnitario,
        valorTotal,
        notaFiscal: input.notaFiscal,
        observacao: input.observacao,
      })
      .returning()
      .all()

    const [movimentacao] = tx
      .insert(movimentacoesEstoque)
      .values({
        estoqueId: estoqueItem.id,
        tipo: 'entrada_compra',
        quantidade: input.quantidade,
        qtdAntes: estoqueItem.qtdAtual,
        qtdDepois: novaQtd,
        referenciaId: compra.id,
        observacao: `Compra registrada | NF: ${input.notaFiscal ?? 'sem NF'}`,
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

    tx.update(compras)
      .set({ movimentacaoEstoqueId: movimentacao.id })
      .where(eq(compras.id, compra.id))
      .run()

    return compra
  })

  await db
    .update(insumos)
    .set({ custoPorUnidade: input.valorUnitario })
    .where(eq(insumos.id, input.insumoId))

  return { compra: resultado, estoqueAtualizado: novaQtd }
}
