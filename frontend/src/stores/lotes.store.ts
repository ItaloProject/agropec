import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

export interface Lote {
  id: number
  nome: string
  codigo?: string
  especie: string
  finalidade?: string
  fase?: string
  localizacao?: string
  qtdAtual: number
  qtdInicial: number
  pesoMedioAtual?: number
  pesoMedioEntrada?: number
  dataEntrada: string
  ativo: boolean
}

export const useLotesStore = defineStore('lotes', () => {
  const lotes = ref<Lote[]>([])
  const carregando = ref(false)

  const lotesAtivos = computed(() => lotes.value.filter(l => l.ativo))

  async function carregar(filtros?: { especie?: string }) {
    carregando.value = true
    try {
      const params = new URLSearchParams({ ativo: 'true', ...filtros })
      const { data } = await api.get(`/lotes?${params}`)
      lotes.value = data
    } catch {
      // silently ignore — UI shows empty state
    } finally {
      carregando.value = false
    }
  }

  async function criar(payload: Partial<Lote>) {
    const { data } = await api.post('/lotes', payload)
    lotes.value.unshift(data)
    return data
  }

  async function atualizar(id: number, payload: Partial<Lote>) {
    const { data } = await api.patch(`/lotes/${id}`, payload)
    const idx = lotes.value.findIndex(l => l.id === id)
    if (idx >= 0) lotes.value[idx] = data
    return data
  }

  async function encerrar(id: number) {
    await api.delete(`/lotes/${id}`)
    const idx = lotes.value.findIndex(l => l.id === id)
    if (idx >= 0) lotes.value[idx]!.ativo = false
  }

  async function buscarKPIs(loteId: number) {
    const { data } = await api.get(`/lotes/${loteId}/kpis`)
    return data
  }

  return { lotes, lotesAtivos, carregando, carregar, criar, atualizar, encerrar, buscarKPIs }
})
