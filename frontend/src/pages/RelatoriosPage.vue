<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Relatórios</h1>
        <div class="page-subtitle">KPIs e desempenho por lote</div>
      </div>
      <q-btn flat round icon="refresh" @click="carregar" :loading="carregando" />
    </div>

    <div v-if="carregando" class="q-py-xl text-center">
      <q-spinner color="primary" size="2.5em" />
    </div>

    <div v-else-if="!lotesStore.lotesAtivos.length" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-msg">Nenhum lote ativo para gerar relatório</div>
      <q-btn color="primary" label="Criar lote" to="/lotes" unelevated class="q-mt-md" no-caps />
    </div>

    <template v-else>
      <!-- KPIs gerais do dashboard -->
      <div class="section-label q-mb-sm">Visão geral da propriedade</div>
      <div class="visao-grid q-mb-xl">
        <div class="visao-card">
          <div class="vc-icon" style="background:#e8f5e9">🐄</div>
          <div class="vc-body">
            <div class="vc-val">{{ totalAnimais }}</div>
            <div class="vc-lbl">Total de animais</div>
          </div>
        </div>
        <div class="visao-card">
          <div class="vc-icon" style="background:#e3f2fd">🏷️</div>
          <div class="vc-body">
            <div class="vc-val">{{ lotesStore.lotesAtivos.length }}</div>
            <div class="vc-lbl">Lotes ativos</div>
          </div>
        </div>
        <div class="visao-card">
          <div class="vc-icon" style="background:#fff8e1">📊</div>
          <div class="vc-body">
            <div class="vc-val">{{ pesoMedioGeral.toFixed(1) }} kg</div>
            <div class="vc-lbl">Peso médio geral</div>
          </div>
        </div>
        <div class="visao-card">
          <div class="vc-icon" style="background:#f3e5f5">📅</div>
          <div class="vc-body">
            <div class="vc-val">{{ diasMedios }} dias</div>
            <div class="vc-lbl">Média de confinamento</div>
          </div>
        </div>
      </div>

      <!-- KPIs por lote -->
      <div class="section-label q-mb-sm">KPIs por lote</div>

      <div v-for="lote in lotesStore.lotesAtivos" :key="lote.id" class="lote-relatorio">
        <div class="lr-header">
          <div class="lr-badge">{{ getEmoji(lote.especie) }}</div>
          <div class="lr-info">
            <div class="lr-nome">{{ lote.nome }}</div>
            <div class="lr-meta">{{ getLabel(lote.especie) }} · {{ lote.fase }} · {{ lote.localizacao }}</div>
          </div>
          <q-btn flat round size="sm" :icon="expanded[lote.id] ? 'expand_less' : 'expand_more'" @click="toggleLote(lote.id)" />
        </div>

        <!-- Métricas básicas sempre visíveis -->
        <div class="lr-metrics">
          <div class="lr-m">
            <div class="lr-val">{{ lote.qtdAtual }}</div>
            <div class="lr-lbl">Cabeças</div>
          </div>
          <div class="lr-div" />
          <div class="lr-m">
            <div class="lr-val">{{ lote.pesoMedioAtual?.toFixed(1) ?? '—' }} kg</div>
            <div class="lr-lbl">Peso médio</div>
          </div>
          <div class="lr-div" />
          <div class="lr-m">
            <div class="lr-val">{{ diasConfinamento(lote.dataEntrada) }}</div>
            <div class="lr-lbl">Dias conf.</div>
          </div>
        </div>

        <!-- KPIs expandidos -->
        <div v-if="expanded[lote.id]">
          <div v-if="kpisLoading[lote.id]" class="q-py-md text-center">
            <q-spinner color="primary" size="sm" />
          </div>
          <div v-else-if="kpis[lote.id]" class="lr-kpis">
            <div class="lr-kpi">
              <div class="lrk-val" :class="kpis[lote.id].gmdKgDia > 0 ? 'text-positive' : 'text-negative'">
                {{ kpis[lote.id].gmdKgDia?.toFixed(3) ?? '—' }} kg/dia
              </div>
              <div class="lrk-lbl">GMD (Ganho Médio Diário)</div>
            </div>
            <div class="lr-kpi">
              <div class="lrk-val">{{ kpis[lote.id].conversaoAlimentar ?? '—' }}</div>
              <div class="lrk-lbl">Conversão alimentar</div>
            </div>
            <div class="lr-kpi">
              <div class="lrk-val">{{ kpis[lote.id].consumoRacaoKgDia?.toFixed(1) ?? '0' }} kg/dia</div>
              <div class="lrk-lbl">Consumo médio de ração</div>
            </div>
            <div class="lr-kpi">
              <div class="lrk-val" :class="kpis[lote.id].taxaMortalidade > 5 ? 'text-negative' : ''">
                {{ kpis[lote.id].taxaMortalidade?.toFixed(1) ?? '0' }}%
              </div>
              <div class="lrk-lbl">Taxa de mortalidade</div>
            </div>
            <div class="lr-kpi">
              <div class="lrk-val">R$ {{ kpis[lote.id].custoPorCabecaDia?.toFixed(2) ?? '0,00' }}</div>
              <div class="lrk-lbl">Custo por cabeça/dia</div>
            </div>
            <div class="lr-kpi" v-if="kpis[lote.id].diasParaAbate">
              <div class="lrk-val text-primary">{{ kpis[lote.id].diasParaAbate }} dias</div>
              <div class="lrk-lbl">Estimativa para abate</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { useLotesStore } from 'src/stores/lotes.store'
import { useEspecies } from 'src/composables/useEspecies'

const lotesStore = useLotesStore()
const { getEmoji, getLabel } = useEspecies()

const carregando = ref(false)
const expanded = ref<Record<number, boolean>>({})
const kpis = ref<Record<number, any>>({})
const kpisLoading = ref<Record<number, boolean>>({})

const totalAnimais = computed(() => lotesStore.lotesAtivos.reduce((s, l) => s + l.qtdAtual, 0))

const pesoMedioGeral = computed(() => {
  const lotes = lotesStore.lotesAtivos.filter(l => l.pesoMedioAtual)
  if (!lotes.length) return 0
  return lotes.reduce((s, l) => s + l.pesoMedioAtual!, 0) / lotes.length
})

const diasMedios = computed(() => {
  const lotes = lotesStore.lotesAtivos
  if (!lotes.length) return 0
  const total = lotes.reduce((s, l) => s + diasConfinamento(l.dataEntrada), 0)
  return Math.round(total / lotes.length)
})

function diasConfinamento(dataEntrada: string) {
  return Math.floor((Date.now() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24))
}

async function toggleLote(id: number) {
  expanded.value[id] = !expanded.value[id]
  if (expanded.value[id] && !kpis.value[id]) {
    kpisLoading.value[id] = true
    try {
      kpis.value[id] = await lotesStore.buscarKPIs(id)
    } finally {
      kpisLoading.value[id] = false
    }
  }
}

async function carregar() {
  carregando.value = true
  try {
    await lotesStore.carregar()
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.section-label {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .7px;
  color: #558b2f;
}

/* Visão geral */
.visao-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
@media (max-width: 899px) { .visao-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 499px) { .visao-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

.visao-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
}
.vc-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
.vc-val  { font-size: 1.3rem; font-weight: 700; color: #1b5e20; }
.vc-lbl  { font-size: .68rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

/* Lote relatório */
.lote-relatorio {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
  margin-bottom: 12px;
}

.lr-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}
.lr-badge { font-size: 1.6rem; width: 44px; height: 44px; background: #f1f8e9; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.lr-info  { flex: 1; min-width: 0; }
.lr-nome  { font-weight: 600; font-size: .95rem; color: #1b5e20; }
.lr-meta  { font-size: .72rem; color: #888; }

.lr-metrics {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}
.lr-m   { flex: 1; text-align: center; }
.lr-div { width: 1px; height: 28px; background: #f0f0f0; flex-shrink: 0; }
.lr-val { font-weight: 700; font-size: 1.05rem; color: #1b5e20; }
.lr-lbl { font-size: .62rem; color: #aaa; text-transform: uppercase; margin-top: 1px; }

.lr-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-top: 1px solid #f5f5f5;
}
@media (max-width: 599px) { .lr-kpis { grid-template-columns: repeat(2, 1fr); } }

.lr-kpi {
  padding: 14px 16px;
  border-right: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}
.lr-kpi:nth-child(3n) { border-right: none; }
.lrk-val { font-size: 1.1rem; font-weight: 700; color: #333; }
.lrk-lbl { font-size: .67rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

.empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06); }
.empty-icon  { font-size: 3rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
