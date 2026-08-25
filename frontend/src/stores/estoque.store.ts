import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

export interface EstoqueItem {
  id: number
  qtdAtual: number
  qtdMinimaAlerta: number
  insumo: {
    id: number
    nome: string
    tipo: string
    unidade: string
    custoPorUnidade?: number
  }
}

export const useEstoqueStore = defineStore('estoque', () => {
  const items = ref<EstoqueItem[]>([])
  const carregando = ref(false)

  const emAlerta = computed(() =>
    items.value.filter(e => e.qtdAtual <= e.qtdMinimaAlerta)
  )

  const racoes = computed(() =>
    items.value.filter(e => ['racao', 'concentrado', 'volumoso', 'suplemento'].includes(e.insumo.tipo))
  )

  async function carregar() {
    carregando.value = true
    try {
      const { data } = await api.get('/estoque')
      items.value = data
    } catch {
      // silently ignore — UI shows empty state
    } finally {
      carregando.value = false
    }
  }

  async function cadastrarInsumo(payload: {
    nome: string
    tipo: string
    unidade?: string
    custoPorUnidade?: number
    qtdInicial?: number
    qtdMinimaAlerta?: number
  }) {
    const { data } = await api.post('/estoque/insumos', payload)
    await carregar()
    return data
  }

  async function ajustarEstoque(estoqueId: number, quantidade: number, observacao?: string) {
    const { data } = await api.post(`/estoque/${estoqueId}/ajuste`, { quantidade, observacao })
    const idx = items.value.findIndex(e => e.id === estoqueId)
    if (idx >= 0) items.value[idx]!.qtdAtual = data.estoqueAtualizado
    return data
  }

  return { items, emAlerta, racoes, carregando, carregar, cadastrarInsumo, ajustarEstoque }
})
