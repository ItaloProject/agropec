<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Alimentação</h1>
        <div class="page-subtitle">Registro de fornecimento de ração</div>
      </div>
    </div>

    <div class="alim-layout">
      <!-- ── Coluna esquerda ─────────────────────────────────────── -->
      <div class="form-col">

        <!-- Wizard de registro -->
        <div class="form-card">
          <div class="fcard-header">
            <div class="form-card-title">REGISTRAR FORNECIMENTO</div>
            <q-btn
              v-if="historico.length"
              flat dense no-caps size="sm" icon="replay" color="primary"
              label="REPETIR ÚLTIMO"
              @click="repetirUltimo"
            >
              <q-tooltip>Pré-preenche com o último registro</q-tooltip>
            </q-btn>
          </div>

          <!-- Progress bar -->
          <div class="step-bar">
            <div v-for="i in 3" :key="i" class="step-item">
              <div class="step-circle" :class="{ active: step === i, done: step > i }">
                <q-icon v-if="step > i" name="check" size="xs" />
                <span v-else>{{ i }}</span>
              </div>
              <div class="step-label" :class="{ active: step >= i }">
                {{ ['LOTE', 'RAÇÃO', 'QUANTIDADE'][i-1] }}
              </div>
            </div>
          </div>

          <!-- Passo 1: Lote -->
          <div v-if="step === 1">
            <div class="step-title">Qual lote vai receber ração?</div>
            <div
              v-for="lote in lotesStore.lotesAtivos" :key="lote.id"
              class="select-item" :class="{ selected: form.loteId === lote.id }"
              @click="selecionarLote(lote)"
            >
              <span class="select-emoji">{{ getEmoji(lote.especie) }}</span>
              <div class="select-body">
                <div class="select-name">{{ lote.nome }}</div>
                <div class="select-sub">{{ lote.qtdAtual }} animais · {{ lote.localizacao ?? 'Sem local' }}</div>
              </div>
              <q-icon v-if="form.loteId === lote.id" name="check_circle" color="primary" />
            </div>
            <div v-if="!lotesStore.lotesAtivos.length" class="empty-step">
              Nenhum lote ativo. <router-link to="/lotes">Criar lote →</router-link>
            </div>
          </div>

          <!-- Passo 2: Ração e turno -->
          <div v-if="step === 2">
            <div class="step-title">Qual ração e em qual turno?</div>

            <div class="form-label">RAÇÃO / INSUMO</div>
            <div v-if="!estoqueFiltrado.length" class="empty-step">
              Nenhuma ração em estoque. <router-link to="/compras">Registrar compra →</router-link>
            </div>
            <div
              v-for="item in estoqueFiltrado" :key="item.id"
              class="select-item" :class="{ selected: form.insumoId === item.insumo.id }"
              @click="form.insumoId = item.insumo.id; insumoSelecionado = item"
            >
              <span class="select-emoji">🌾</span>
              <div class="select-body">
                <div class="select-name">{{ item.insumo.nome }}</div>
                <div class="select-sub">
                  {{ item.qtdAtual.toFixed(1) }} {{ item.insumo.unidade }} em estoque
                  <span v-if="item.qtdAtual <= item.qtdMinimaAlerta" class="text-orange-8"> · ⚠️ crítico</span>
                </div>
              </div>
              <q-icon v-if="form.insumoId === item.insumo.id" name="check_circle" color="primary" />
            </div>

            <div class="form-label q-mt-md">TURNO</div>
            <div class="turno-grid">
              <div
                v-for="t in turnos" :key="t.valor"
                class="turno-item" :class="{ selected: form.turno === t.valor }"
                @click="form.turno = t.valor"
              >
                <div class="turno-emoji">{{ t.emoji }}</div>
                <div class="turno-label">{{ t.label }}</div>
              </div>
            </div>

            <div class="form-label q-mt-md">DATA DO FORNECIMENTO</div>
            <q-input v-model="form.data" type="date" outlined dense />
          </div>

          <!-- Passo 3: Quantidade -->
          <div v-if="step === 3">
            <div class="step-title">Quanto foi fornecido?</div>

            <div class="resumo-lote q-mb-md">
              <span>{{ getEmoji(loteSelecionado?.especie) }}</span>
              <strong>{{ loteSelecionado?.nome }}</strong>
              <span class="text-grey-6">· {{ loteSelecionado?.qtdAtual }} animais</span>
              <q-space />
              <span class="turno-badge">{{ turnos.find(t => t.valor === form.turno)?.emoji }} {{ turnos.find(t => t.valor === form.turno)?.label }}</span>
            </div>

            <div v-if="sugestaoKg" class="sugestao-box q-mb-sm">
              💡 Dieta configurada: <strong>{{ sugestaoKg.toFixed(1) }} kg</strong>
              <q-btn size="xs" flat color="primary" label="USAR" @click="form.qtdKgTotal = sugestaoKg!" no-caps />
            </div>

            <q-input
              v-model.number="form.qtdKgTotal"
              type="number"
              label="QUANTIDADE TOTAL (KG) *"
              outlined dense
              :rules="[val => val > 0 || 'Informe a quantidade']"
              class="q-mb-sm"
              step="0.5"
              autofocus
            >
              <template #append>
                <span class="text-caption text-grey-6">
                  {{ loteQtdPorCabeca.toFixed(2) }} kg/cab
                </span>
              </template>
            </q-input>

            <q-input v-model="form.observacao" label="OBSERVAÇÃO (OPCIONAL)" outlined dense class="q-mb-md" />

            <div class="resumo-box">
              <div class="resumo-row"><span>Lote</span><strong>{{ loteSelecionado?.nome }}</strong></div>
              <div class="resumo-row"><span>Ração</span><strong>{{ insumoSelecionado?.insumo.nome }}</strong></div>
              <div class="resumo-row">
                <span>Turno</span>
                <strong>{{ turnos.find(t => t.valor === form.turno)?.emoji }} {{ turnos.find(t => t.valor === form.turno)?.label }}</strong>
              </div>
              <div class="resumo-row"><span>Data</span><strong>{{ formatarData(form.data) }}</strong></div>
              <div class="resumo-row"><span>Total</span><strong>{{ form.qtdKgTotal ?? 0 }} kg</strong></div>
              <div v-if="custoEstimado" class="resumo-row">
                <span>Custo estimado</span><strong class="text-positive">R$ {{ custoEstimado.toFixed(2) }}</strong>
              </div>
            </div>
          </div>

          <!-- Navegação -->
          <div class="wizard-nav">
            <q-btn v-if="step > 1" flat label="VOLTAR" @click="step--" no-caps />
            <q-space />
            <q-btn
              v-if="step < 3"
              color="primary" label="PRÓXIMO" icon-right="arrow_forward"
              @click="avancar" :disable="!podeAvancar" unelevated no-caps
            />
            <q-btn
              v-if="step === 3"
              color="positive" label="CONFIRMAR" icon="check"
              @click="confirmar" :loading="enviando"
              :disable="!form.qtdKgTotal || form.qtdKgTotal <= 0"
              unelevated no-caps
            />
          </div>
        </div>

        <!-- Dietas configuradas -->
        <div class="form-card q-mt-md">
          <div class="fcard-header">
            <div class="form-card-title">DIETAS CONFIGURADAS</div>
            <q-btn flat dense round icon="add" color="primary" @click="adicionarDietaOpen = !adicionarDietaOpen">
              <q-tooltip>Adicionar dieta</q-tooltip>
            </q-btn>
          </div>

          <!-- Formulário para adicionar dieta -->
          <div v-if="adicionarDietaOpen" class="add-dieta-form q-mb-md">
            <div class="row q-gutter-sm q-mb-sm">
              <q-select
                v-model="novaDieta.loteId" :options="opcoesLotes"
                label="LOTE" outlined dense class="col" emit-value map-options
              />
              <q-select
                v-model="novaDieta.insumoId" :options="opcoesInsumos"
                label="RAÇÃO" outlined dense class="col" emit-value map-options
              />
            </div>
            <div class="row q-gutter-sm q-mb-sm">
              <q-select
                v-model="novaDieta.turno"
                :options="turnoOpts"
                label="TURNO" outlined dense class="col" emit-value map-options
              />
              <q-input
                v-model.number="novaDieta.qtdKgPorCabeca"
                type="number" label="KG / CABEÇA" outlined dense class="col" step="0.1"
              />
            </div>
            <q-btn
              color="primary" label="SALVAR DIETA" icon="save" unelevated no-caps
              class="full-width" size="sm" :loading="salvandoDieta"
              :disable="!novaDieta.loteId || !novaDieta.insumoId || !novaDieta.qtdKgPorCabeca"
              @click="salvarDieta"
            />
          </div>

          <!-- Lista de dietas -->
          <div v-if="carregandoDietas" class="q-py-md text-center">
            <q-spinner color="primary" size="sm" />
          </div>
          <div v-else-if="!dietas.length" class="dieta-vazia">
            Nenhuma dieta configurada. Adicione uma para ter sugestões automáticas de quantidade.
          </div>
          <div v-else class="dieta-list">
            <div v-for="d in dietas" :key="d.id" class="dieta-item">
              <div class="di-info">
                <div class="di-lote">{{ d.lote?.nome }}</div>
                <div class="di-sub">
                  {{ d.insumo?.nome }} ·
                  {{ turnos.find(t => t.valor === d.turno)?.emoji }}
                  {{ turnos.find(t => t.valor === d.turno)?.label }} ·
                  <strong>{{ d.qtdKgPorCabeca }} kg/cab</strong>
                </div>
              </div>
              <q-btn flat round dense icon="delete" color="negative" size="xs" @click="removerDieta(d.id)">
                <q-tooltip>Remover dieta</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Coluna direita: histórico ──────────────────────────── -->
      <div class="hist-col">

        <!-- Resumo do dia -->
        <div v-if="resumoDia.total > 0" class="resumo-dia q-mb-md">
          <div class="rd-item">
            <div class="rd-val">{{ resumoDia.registros }}</div>
            <div class="rd-lbl">Registros hoje</div>
          </div>
          <div class="rd-div" />
          <div class="rd-item">
            <div class="rd-val">{{ resumoDia.total.toFixed(0) }} <span class="rd-unit">kg</span></div>
            <div class="rd-lbl">Total fornecido</div>
          </div>
          <div v-if="resumoDia.custo > 0" class="rd-div" />
          <div v-if="resumoDia.custo > 0" class="rd-item">
            <div class="rd-val">R$ {{ resumoDia.custo.toFixed(2) }}</div>
            <div class="rd-lbl">Custo do dia</div>
          </div>
        </div>

        <!-- Filtro por lote -->
        <div class="hist-header">
          <div class="hist-title">HISTÓRICO</div>
          <q-btn flat round icon="refresh" size="sm" @click="carregarHistorico" :loading="carregandoHist" />
        </div>

        <div class="filtro-chips q-mb-md">
          <div
            class="filtro-chip" :class="{ active: filtroLoteId === null }"
            @click="filtroLoteId = null; carregarHistorico()"
          >Todos</div>
          <div
            v-for="lote in lotesNoHistorico" :key="lote.id"
            class="filtro-chip" :class="{ active: filtroLoteId === lote.id }"
            @click="filtroLoteId = lote.id; carregarHistorico()"
          >{{ getEmoji(lote.especie) }} {{ lote.nome }}</div>
        </div>

        <div v-if="carregandoHist" class="q-py-xl text-center">
          <q-spinner color="primary" />
        </div>

        <div v-else-if="!historico.length" class="empty-state">
          <div class="empty-icon">🌾</div>
          <div class="empty-msg">Nenhum fornecimento registrado</div>
        </div>

        <div v-else class="historico-list">
          <div v-for="reg in historico" :key="reg.id" class="historico-item">
            <div class="hist-badge">{{ getEmoji(reg.lote?.especie) }}</div>
            <div class="hist-body">
              <div class="hist-nome">{{ reg.lote?.nome }}</div>
              <div class="hist-sub">
                {{ reg.insumo?.nome }} ·
                {{ turnos.find(t => t.valor === reg.turno)?.emoji }}
                {{ turnos.find(t => t.valor === reg.turno)?.label }}
              </div>
            </div>
            <div class="hist-right">
              <div class="hist-qtd">{{ reg.qtdKgTotal }} kg</div>
              <div class="hist-data">{{ formatarData(reg.data) }}</div>
              <div v-if="reg.custoTotal" class="hist-custo">R$ {{ reg.custoTotal.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useLotesStore } from 'src/stores/lotes.store'
import { useEstoqueStore } from 'src/stores/estoque.store'
import { useEspecies } from 'src/composables/useEspecies'

const $q = useQuasar()
const lotesStore = useLotesStore()
const estoqueStore = useEstoqueStore()
const { getEmoji } = useEspecies()

const step = ref(1)
const enviando = ref(false)
const carregandoHist = ref(false)
const carregandoDietas = ref(false)
const salvandoDieta = ref(false)
const adicionarDietaOpen = ref(false)
const historico = ref<any[]>([])
const dietas = ref<any[]>([])
const filtroLoteId = ref<number | null>(null)

const loteSelecionado = ref<any>(null)
const insumoSelecionado = ref<any>(null)
const sugestaoKg = ref<number | null>(null)

const novaDieta = ref({
  loteId: null as number | null,
  insumoId: null as number | null,
  turno: 'manha' as string,
  qtdKgPorCabeca: null as number | null,
})

function turnoAtual(): 'manha' | 'tarde' | 'noite' {
  const h = new Date().getHours()
  if (h < 12) return 'manha'
  if (h < 18) return 'tarde'
  return 'noite'
}

const form = ref({
  loteId: null as number | null,
  insumoId: null as number | null,
  turno: turnoAtual(),
  qtdKgTotal: null as number | null,
  observacao: '',
  data: new Date().toISOString().split('T')[0],
})

const turnos = [
  { valor: 'manha', emoji: '🌅', label: 'Manhã' },
  { valor: 'tarde', emoji: '☀️', label: 'Tarde' },
  { valor: 'noite', emoji: '🌙', label: 'Noite' },
]

const turnoOpts = turnos.map(t => ({ label: `${t.emoji} ${t.label}`, value: t.valor }))

const estoqueFiltrado = computed(() =>
  estoqueStore.items.filter(e =>
    ['racao', 'concentrado', 'volumoso', 'suplemento'].includes(e.insumo.tipo)
  )
)

const opcoesLotes = computed(() =>
  lotesStore.lotesAtivos.map(l => ({ label: l.nome, value: l.id }))
)

const opcoesInsumos = computed(() =>
  estoqueFiltrado.value.map(e => ({ label: e.insumo.nome, value: e.insumo.id }))
)

const loteQtdPorCabeca = computed(() => {
  if (!form.value.qtdKgTotal || !loteSelecionado.value) return 0
  return form.value.qtdKgTotal / (loteSelecionado.value.qtdAtual || 1)
})

const custoEstimado = computed(() => {
  if (!form.value.qtdKgTotal || !insumoSelecionado.value?.insumo?.custoPorUnidade) return null
  return form.value.qtdKgTotal * insumoSelecionado.value.insumo.custoPorUnidade
})

const podeAvancar = computed(() => {
  if (step.value === 1) return !!form.value.loteId
  if (step.value === 2) return !!form.value.insumoId && !!form.value.turno
  return !!form.value.qtdKgTotal && (form.value.qtdKgTotal ?? 0) > 0
})

const hoje = new Date().toISOString().split('T')[0]!

const resumoDia = computed(() => {
  const registrosHoje = historico.value.filter(r => r.data === hoje)
  return {
    registros: registrosHoje.length,
    total: registrosHoje.reduce((s, r) => s + (r.qtdKgTotal ?? 0), 0),
    custo: registrosHoje.reduce((s, r) => s + (r.custoTotal ?? 0), 0),
  }
})

const lotesNoHistorico = computed(() => {
  const map = new Map<number, any>()
  historico.value.forEach(r => {
    if (r.lote && !map.has(r.lote.id)) map.set(r.lote.id, r.lote)
  })
  return [...map.values()]
})

function selecionarLote(lote: any) {
  form.value.loteId = lote.id
  loteSelecionado.value = lote
  avancar()
}

async function avancar() {
  step.value++
  if (step.value === 2 && form.value.loteId) {
    try {
      const { data } = await api.get(`/alimentacao/dietas?loteId=${form.value.loteId}`)
      const dietaDoTurno = data.find((d: any) => d.turno === form.value.turno)
      if (dietaDoTurno) {
        sugestaoKg.value = dietaDoTurno.qtdKgPorCabeca * (loteSelecionado.value?.qtdAtual ?? 1)
      } else {
        sugestaoKg.value = null
      }
    } catch {}
  }
}

function repetirUltimo() {
  const ultimo = historico.value[0]
  if (!ultimo) return

  const lote = lotesStore.lotesAtivos.find(l => l.id === ultimo.loteId)
  const estoqueItem = estoqueStore.items.find(e => e.insumo.id === ultimo.insumoId)

  if (!lote || !estoqueItem) {
    $q.notify({ type: 'warning', message: 'Lote ou ração do último registro não está mais disponível.' })
    return
  }

  form.value = {
    loteId: ultimo.loteId,
    insumoId: ultimo.insumoId,
    turno: ultimo.turno,
    qtdKgTotal: ultimo.qtdKgTotal,
    observacao: '',
    data: new Date().toISOString().split('T')[0],
  }
  loteSelecionado.value = lote
  insumoSelecionado.value = estoqueItem
  step.value = 3

  $q.notify({ type: 'info', message: 'Pré-preenchido com o último registro. Confirme ou ajuste.' })
}

async function confirmar() {
  if (!form.value.loteId || !form.value.insumoId || !form.value.qtdKgTotal) return
  enviando.value = true
  try {
    const { data } = await api.post('/alimentacao', form.value)
    $q.notify({
      type: 'positive',
      message: `${form.value.qtdKgTotal} kg registrados!`,
      caption: data.alerta ?? `Estoque restante: ${data.estoqueRestante?.toFixed(1)} kg`,
    })
    if (data.alerta) $q.notify({ type: 'warning', message: data.alerta })
    step.value = 1
    form.value = {
      loteId: null, insumoId: null, turno: turnoAtual(),
      qtdKgTotal: null, observacao: '', data: new Date().toISOString().split('T')[0],
    }
    loteSelecionado.value = null
    insumoSelecionado.value = null
    sugestaoKg.value = null
    await Promise.all([estoqueStore.carregar(), carregarHistorico()])
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar' })
  } finally {
    enviando.value = false
  }
}

async function carregarHistorico() {
  carregandoHist.value = true
  try {
    const params = filtroLoteId.value ? `?loteId=${filtroLoteId.value}&limite=50` : '?limite=50'
    historico.value = await api.get(`/alimentacao${params}`).then(r => r.data)
  } finally {
    carregandoHist.value = false
  }
}

async function carregarDietas() {
  carregandoDietas.value = true
  try {
    dietas.value = await api.get('/alimentacao/dietas').then(r => r.data)
  } finally {
    carregandoDietas.value = false
  }
}

async function salvarDieta() {
  if (!novaDieta.value.loteId || !novaDieta.value.insumoId || !novaDieta.value.qtdKgPorCabeca) return
  salvandoDieta.value = true
  try {
    await api.post('/alimentacao/dietas', novaDieta.value)
    $q.notify({ type: 'positive', message: 'Dieta configurada com sucesso!' })
    novaDieta.value = { loteId: null, insumoId: null, turno: 'manha', qtdKgPorCabeca: null }
    adicionarDietaOpen.value = false
    await carregarDietas()
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao salvar dieta' })
  } finally {
    salvandoDieta.value = false
  }
}

async function removerDieta(id: number) {
  $q.dialog({
    title: 'Remover dieta',
    message: 'Remover essa dieta configurada?',
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Remover', color: 'negative', unelevated: true },
  }).onOk(async () => {
    await api.delete(`/alimentacao/dietas/${id}`)
    $q.notify({ type: 'positive', message: 'Dieta removida.' })
    await carregarDietas()
  })
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

onMounted(async () => {
  await Promise.all([
    lotesStore.carregar(),
    estoqueStore.carregar(),
    carregarHistorico(),
    carregarDietas(),
  ])
})
</script>

<style scoped>
.alim-layout {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 899px) {
  .alim-layout { grid-template-columns: 1fr; }
}

/* ── Form card ─────────────────────────────────────────────────── */
.form-card {
  background: white; border-radius: 14px; padding: 22px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
}
.fcard-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.form-card-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f;
}

/* Progress bar */
.step-bar {
  display: flex; align-items: flex-start; justify-content: center;
  margin-bottom: 24px; position: relative;
}
.step-bar::before {
  content: ''; position: absolute; top: 15px; left: 15%; right: 15%;
  height: 2px; background: #e0e0e0; z-index: 0;
}
.step-item {
  display: flex; flex-direction: column; align-items: center;
  gap: 5px; flex: 1; position: relative; z-index: 1;
}
.step-circle {
  width: 30px; height: 30px; border-radius: 50%;
  background: #e0e0e0; color: #999;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: .85rem; transition: all .3s;
}
.step-circle.active { background: #2e7d32; color: white; }
.step-circle.done   { background: #81c784; color: white; }
.step-label {
  font-size: .62rem; color: #aaa; text-transform: uppercase;
  font-weight: 600; letter-spacing: .4px;
}
.step-label.active { color: #2e7d32; }

.step-title {
  font-size: 1rem; font-weight: 600; color: #1b5e20; margin-bottom: 14px;
}

/* Select items */
.select-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px; border: 2px solid #e8e8e8;
  margin-bottom: 8px; cursor: pointer; transition: all .2s;
}
.select-item:hover    { border-color: #81c784; background: #f9fbe7; }
.select-item.selected { border-color: #2e7d32; background: #e8f5e9; }
.select-emoji { font-size: 1.4rem; width: 32px; text-align: center; }
.select-body  { flex: 1; min-width: 0; }
.select-name  { font-weight: 600; font-size: .9rem; }
.select-sub   { font-size: .73rem; color: #888; margin-top: 1px; }

/* Turno */
.turno-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.turno-item {
  border: 2px solid #e8e8e8; border-radius: 10px; padding: 10px 8px;
  text-align: center; cursor: pointer; transition: all .2s;
}
.turno-item:hover    { border-color: #81c784; background: #f9fbe7; }
.turno-item.selected { border-color: #2e7d32; background: #e8f5e9; }
.turno-emoji { font-size: 1.5rem; }
.turno-label { font-size: .75rem; font-weight: 600; color: #555; margin-top: 3px; }

/* Resumo passo 3 */
.resumo-lote {
  display: flex; align-items: center; gap: 8px; font-size: .9rem;
  background: #f5f5f5; border-radius: 8px; padding: 8px 12px;
}
.turno-badge {
  font-size: .78rem; background: #e8f5e9; color: #2e7d32;
  padding: 2px 8px; border-radius: 12px; font-weight: 600;
}
.sugestao-box {
  background: #e8f5e9; border-radius: 8px; padding: 8px 12px;
  font-size: .85rem; color: #2e7d32; display: flex; align-items: center; gap: 8px;
}
.resumo-box {
  background: #f9fbe7; border-radius: 10px; padding: 14px; border: 1px solid #c8e6c9;
}
.resumo-row {
  display: flex; justify-content: space-between; padding: 5px 0;
  font-size: .85rem; border-bottom: 1px solid #e8f5e9; color: #555;
}
.resumo-row:last-child { border: none; }
.resumo-row strong { color: #1b5e20; }

/* Wizard nav */
.wizard-nav {
  display: flex; align-items: center; margin-top: 18px;
  padding-top: 14px; border-top: 1px solid #f0f0f0;
}

.form-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #558b2f; margin-bottom: 8px;
}

/* ── Dietas ────────────────────────────────────────────────────── */
.add-dieta-form {
  background: #f9fbe7; border-radius: 10px; padding: 14px;
  border: 1px solid #c8e6c9;
}
.dieta-list { display: flex; flex-direction: column; gap: 6px; }
.dieta-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px; border: 1px solid #e8e8e8; background: #fafafa;
}
.di-info  { flex: 1; min-width: 0; }
.di-lote  { font-weight: 600; font-size: .85rem; color: #1b5e20; }
.di-sub   { font-size: .72rem; color: #888; margin-top: 1px; }
.dieta-vazia {
  font-size: .82rem; color: #aaa; text-align: center; padding: 12px 0;
}

/* ── Resumo do dia ─────────────────────────────────────────────── */
.resumo-dia {
  background: white; border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
  display: flex; align-items: center; gap: 0;
}
.rd-item  { flex: 1; text-align: center; }
.rd-div   { width: 1px; height: 32px; background: #e8e8e8; flex-shrink: 0; }
.rd-val   { font-size: 1.25rem; font-weight: 700; color: #2e7d32; }
.rd-unit  { font-size: .8rem; font-weight: 400; }
.rd-lbl   { font-size: .65rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

/* ── Histórico ─────────────────────────────────────────────────── */
.hist-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.hist-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f;
}

.filtro-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.filtro-chip {
  padding: 4px 12px; border-radius: 20px; border: 1px solid #ddd;
  font-size: .75rem; cursor: pointer; transition: all .15s;
  background: white; white-space: nowrap;
}
.filtro-chip:hover { border-color: #81c784; }
.filtro-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

.historico-list { display: flex; flex-direction: column; gap: 8px; }
.historico-item {
  background: white; border-radius: 12px; padding: 12px 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.06); border: 1px solid rgba(0,0,0,.04);
}
.hist-badge { font-size: 1.4rem; width: 36px; text-align: center; flex-shrink: 0; }
.hist-body  { flex: 1; min-width: 0; }
.hist-nome  { font-weight: 600; font-size: .9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-sub   { font-size: .73rem; color: #888; margin-top: 1px; }
.hist-right { text-align: right; flex-shrink: 0; }
.hist-qtd   { font-weight: 700; color: #2e7d32; font-size: .95rem; }
.hist-data  { font-size: .7rem; color: #aaa; }
.hist-custo { font-size: .7rem; color: #888; }

.empty-step {
  text-align: center; padding: 24px; color: #aaa; font-size: .9rem;
}
.empty-state {
  text-align: center; padding: 48px 20px; background: white;
  border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg  { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }

@media (max-width: 599px) {
  .form-card { padding: 16px; }
}
</style>
