<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Lotes</h1>
        <div class="page-subtitle">{{ lotesStore.lotesAtivos.length }} lotes ativos</div>
      </div>
      <div class="header-actions">
        <!-- Toggle de visão -->
        <div class="visao-toggle">
          <q-btn
            flat dense round icon="grid_view"
            :color="visao === 'grade' ? 'primary' : 'grey-5'"
            @click="visao = 'grade'"
          >
            <q-tooltip>Vista em grade</q-tooltip>
          </q-btn>
          <q-btn
            flat dense round icon="view_sidebar"
            :color="visao === 'individual' ? 'primary' : 'grey-5'"
            @click="mudarParaIndividual"
          >
            <q-tooltip>Vista individual</q-tooltip>
          </q-btn>
        </div>
        <q-btn color="primary" icon="add" label="NOVO LOTE" @click="abrirForm = true" unelevated />
      </div>
    </div>

    <!-- Filtro por espécie -->
    <div class="chip-scroll q-mb-md" v-if="especiesNosLotes.length > 1">
      <div class="chip-bar">
        <div class="especie-chip" :class="{ active: especieFiltro === '' }" @click="especieFiltro = ''">
          Todos
        </div>
        <div
          v-for="e in especiesNosLotes" :key="e.valor"
          class="especie-chip" :class="{ active: especieFiltro === e.valor }"
          @click="especieFiltro = e.valor"
        >{{ e.emoji }} {{ e.label }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="lotesStore.carregando" class="q-py-xl text-center">
      <q-spinner color="primary" size="2.5em" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!lotesFiltrados.length" class="empty-state">
      <div class="empty-icon">🏷️</div>
      <div class="empty-msg">Nenhum lote encontrado</div>
      <q-btn color="primary" label="Criar primeiro lote" @click="abrirForm = true" unelevated class="q-mt-md" no-caps />
    </div>

    <template v-else>
      <!-- ─── VISTA EM GRADE ─────────────────────────────────────────── -->
      <div v-if="visao === 'grade'" class="lotes-grid">
        <div v-for="lote in lotesFiltrados" :key="lote.id" class="lote-card">
          <div class="lote-header">
            <div class="lote-badge">{{ getEmoji(lote.especie) }}</div>
            <div class="lote-info">
              <div class="lote-nome">{{ lote.nome }}</div>
              <div class="lote-sub">
                {{ getLabel(lote.especie) }}
                <span v-if="lote.codigo"> · #{{ lote.codigo }}</span>
              </div>
            </div>
            <q-btn flat round icon="more_vert" dense size="sm">
              <q-menu anchor="bottom right" self="top right">
                <q-list dense>
                  <q-item clickable @click="verKPIs(lote)" v-close-popup>
                    <q-item-section avatar><q-icon name="bar_chart" size="xs" /></q-item-section>
                    <q-item-section>Ver KPIs</q-item-section>
                  </q-item>
                  <q-item clickable @click="abrirEdicao(lote)" v-close-popup>
                    <q-item-section avatar><q-icon name="edit" size="xs" /></q-item-section>
                    <q-item-section>Editar lote</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable @click="encerrarLote(lote)" v-close-popup class="text-negative">
                    <q-item-section avatar><q-icon name="stop_circle" size="xs" color="negative" /></q-item-section>
                    <q-item-section>Encerrar lote</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <div class="lote-metrics">
            <div class="metric">
              <div class="val">{{ lote.qtdAtual }}</div>
              <div class="lbl">Cabeças</div>
            </div>
            <div class="metric-div" />
            <div class="metric">
              <div class="val">{{ lote.pesoMedioAtual?.toFixed(1) ?? '—' }}</div>
              <div class="lbl">Peso médio kg</div>
            </div>
            <div class="metric-div" />
            <div class="metric">
              <div class="val">{{ diasConfinamento(lote.dataEntrada) }}</div>
              <div class="lbl">Dias</div>
            </div>
          </div>

          <div class="lote-chips">
            <q-chip dense size="sm" :color="faseColor(lote.fase)" text-color="white" class="q-ma-none" style="text-transform:uppercase;font-size:.65rem">
              {{ fases.find(f => f.value === lote.fase)?.label ?? (lote.fase ?? 'SEM FASE').toUpperCase() }}
            </q-chip>
            <q-chip dense size="sm" class="q-ma-none q-ml-xs bg-grey-2 text-grey-8" style="text-transform:uppercase;font-size:.65rem">
              {{ lote.localizacao ?? 'SEM LOCAL' }}
            </q-chip>
          </div>
        </div>
      </div>

      <!-- ─── VISTA INDIVIDUAL ───────────────────────────────────────── -->
      <div v-else class="individual-layout">

        <!-- Lista de lotes (esquerda) -->
        <div class="lista-panel">
          <div class="lista-title">SELECIONAR LOTE</div>
          <div
            v-for="lote in lotesFiltrados" :key="lote.id"
            class="lista-item" :class="{ ativo: loteSelecionado?.id === lote.id }"
            @click="selecionarLote(lote)"
          >
            <div class="li-badge">{{ getEmoji(lote.especie) }}</div>
            <div class="li-body">
              <div class="li-nome">{{ lote.nome }}</div>
              <div class="li-sub">{{ lote.qtdAtual }} cab · {{ lote.pesoMedioAtual?.toFixed(0) ?? '—' }} kg</div>
            </div>
            <q-chip
              dense size="xs"
              :color="faseColor(lote.fase)"
              text-color="white"
              class="q-ma-none li-fase"
              style="font-size:.6rem;text-transform:uppercase"
            >{{ fases.find(f => f.value === lote.fase)?.label?.slice(0,4) ?? '—' }}</q-chip>
          </div>
        </div>

        <!-- Painel de detalhe (direita) -->
        <div class="detalhe-panel">
          <div v-if="!loteSelecionado" class="detalhe-vazio">
            <div class="dv-icon">👈</div>
            <div class="dv-msg">Selecione um lote para ver os detalhes</div>
          </div>

          <template v-else>
            <!-- Cabeçalho do detalhe -->
            <div class="detalhe-header">
              <div class="dh-badge">{{ getEmoji(loteSelecionado.especie) }}</div>
              <div class="dh-info">
                <div class="dh-nome">{{ loteSelecionado.nome }}</div>
                <div class="dh-sub">
                  {{ getLabel(loteSelecionado.especie) }}
                  <span v-if="loteSelecionado.codigo"> · #{{ loteSelecionado.codigo }}</span>
                  <span v-if="loteSelecionado.localizacao"> · {{ loteSelecionado.localizacao }}</span>
                </div>
              </div>
              <div class="dh-acoes">
                <q-btn flat dense round icon="edit" color="primary" @click="abrirEdicao(loteSelecionado)">
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn flat dense round icon="stop_circle" color="negative" @click="encerrarLote(loteSelecionado)">
                  <q-tooltip>Encerrar lote</q-tooltip>
                </q-btn>
              </div>
            </div>

            <!-- Métricas principais -->
            <div class="detalhe-metricas">
              <div class="dm-item">
                <div class="dm-val">{{ loteSelecionado.qtdAtual }}</div>
                <div class="dm-lbl">Cabeças atuais</div>
              </div>
              <div class="dm-div" />
              <div class="dm-item">
                <div class="dm-val">{{ loteSelecionado.qtdInicial }}</div>
                <div class="dm-lbl">Entrada</div>
              </div>
              <div class="dm-div" />
              <div class="dm-item">
                <div class="dm-val">{{ loteSelecionado.pesoMedioAtual?.toFixed(1) ?? '—' }} <span class="dm-unit">kg</span></div>
                <div class="dm-lbl">Peso médio</div>
              </div>
              <div class="dm-div" />
              <div class="dm-item">
                <div class="dm-val">{{ loteSelecionado.pesoMedioEntrada?.toFixed(1) ?? '—' }} <span class="dm-unit">kg</span></div>
                <div class="dm-lbl">Peso entrada</div>
              </div>
              <div class="dm-div" />
              <div class="dm-item">
                <div class="dm-val">{{ diasConfinamento(loteSelecionado.dataEntrada) }}</div>
                <div class="dm-lbl">Dias conf.</div>
              </div>
            </div>

            <!-- Chips de info -->
            <div class="detalhe-chips">
              <q-chip dense :color="faseColor(loteSelecionado.fase)" text-color="white" style="text-transform:uppercase;font-size:.7rem">
                {{ fases.find(f => f.value === loteSelecionado.fase)?.label ?? (loteSelecionado.fase ?? 'SEM FASE').toUpperCase() }}
              </q-chip>
              <q-chip v-if="loteSelecionado.finalidade" dense class="bg-blue-1 text-blue-9" style="text-transform:uppercase;font-size:.7rem">
                {{ finalidades.find(f => f.value === loteSelecionado.finalidade)?.label ?? loteSelecionado.finalidade.toUpperCase() }}
              </q-chip>
              <q-chip v-if="loteSelecionado.localizacao" dense class="bg-grey-2 text-grey-8" style="text-transform:uppercase;font-size:.7rem">
                {{ loteSelecionado.localizacao }}
              </q-chip>
              <q-chip dense class="bg-grey-1 text-grey-6" style="font-size:.7rem">
                Entrada: {{ formatarData(loteSelecionado.dataEntrada) }}
              </q-chip>
            </div>

            <q-separator class="q-my-md" />

            <!-- KPIs -->
            <div class="detalhe-kpi-titulo">KPIs DO LOTE</div>

            <div v-if="kpiCarregando" class="q-py-md text-center">
              <q-spinner color="primary" size="sm" />
            </div>
            <div v-else-if="!kpiIndividual" class="kpi-vazio">
              <q-btn flat dense label="Carregar KPIs" icon="bar_chart" color="primary" @click="carregarKPIIndividual" no-caps />
            </div>
            <div v-else class="detalhe-kpis">
              <div class="dk-item">
                <div class="dk-val" :class="kpiIndividual.gmdKgDia > 0 ? 'text-positive' : 'text-negative'">
                  {{ kpiIndividual.gmdKgDia?.toFixed(3) ?? '—' }}
                </div>
                <div class="dk-lbl">GMD (kg/dia)</div>
              </div>
              <div class="dk-item">
                <div class="dk-val">{{ kpiIndividual.conversaoAlimentar ?? '—' }}</div>
                <div class="dk-lbl">Conv. Alimentar</div>
              </div>
              <div class="dk-item">
                <div class="dk-val">{{ kpiIndividual.consumoRacaoKgDia?.toFixed(1) ?? '0' }}</div>
                <div class="dk-lbl">Ração/dia (kg)</div>
              </div>
              <div class="dk-item">
                <div class="dk-val" :class="kpiIndividual.taxaMortalidade > 5 ? 'text-negative' : ''">
                  {{ kpiIndividual.taxaMortalidade?.toFixed(1) ?? '0' }}%
                </div>
                <div class="dk-lbl">Mortalidade</div>
              </div>
              <div class="dk-item">
                <div class="dk-val">R$ {{ kpiIndividual.custoPorCabecaDia?.toFixed(2) ?? '0,00' }}</div>
                <div class="dk-lbl">Custo/cab/dia</div>
              </div>
              <div class="dk-item" v-if="kpiIndividual.diasParaAbate">
                <div class="dk-val text-primary">{{ kpiIndividual.diasParaAbate }}</div>
                <div class="dk-lbl">Dias p/ abate</div>
              </div>
            </div>

            <!-- Observação -->
            <div v-if="loteSelecionado.observacao" class="detalhe-obs">
              <div class="obs-label">OBSERVAÇÃO</div>
              <div class="obs-texto">{{ loteSelecionado.observacao }}</div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- Dialog: Novo Lote -->
    <q-dialog v-model="abrirForm" :maximized="$q.screen.xs">
      <q-card class="form-card">
        <q-card-section class="row items-center bg-primary text-white q-py-sm">
          <q-icon name="add_circle" size="sm" class="q-mr-sm" />
          <div class="text-h6">Novo Lote</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md scroll" style="max-height: 70vh">
          <q-form @submit="criarLote" class="q-gutter-sm">
            <div class="form-section-label">ESPÉCIE</div>
            <div class="especie-btn-grid">
              <q-btn
                v-for="e in ESPECIES" :key="e.valor"
                :color="novoLote.especie === e.valor ? 'primary' : 'grey-3'"
                :text-color="novoLote.especie === e.valor ? 'white' : 'grey-8'"
                :label="`${e.emoji} ${e.label}`"
                @click="novoLote.especie = e.valor"
                unelevated no-caps
                class="especie-btn"
                size="sm"
              />
            </div>

            <q-input v-model="novoLote.nome" label="NOME DO LOTE *" outlined dense :rules="[v => !!v || 'Obrigatório']" />
            <div class="row q-gutter-sm">
              <q-input v-model="novoLote.codigo" label="CÓDIGO INTERNO" outlined dense class="col" />
              <q-input v-model="novoLote.localizacao" label="LOCALIZAÇÃO" outlined dense class="col" />
            </div>

            <div class="row q-gutter-sm">
              <q-select
                v-model="novoLote.finalidade"
                :options="finalidades"
                label="FINALIDADE"
                outlined dense class="col"
                emit-value map-options
              />
              <q-select
                v-model="novoLote.fase"
                :options="fases"
                label="FASE"
                outlined dense class="col"
                emit-value map-options
              />
            </div>

            <div class="row q-gutter-sm">
              <q-input v-model.number="novoLote.qtdInicial" type="number" label="QTD INICIAL *" outlined dense class="col" :rules="[v => v > 0 || 'Obrigatório']" />
              <q-input v-model.number="novoLote.pesoMedioEntrada" type="number" label="PESO MÉDIO ENTRADA (KG)" outlined dense class="col" />
            </div>

            <q-input v-model="novoLote.dataEntrada" type="date" label="DATA DE ENTRADA *" outlined dense />
            <q-input v-model="novoLote.observacao" label="OBSERVAÇÃO" outlined dense type="textarea" rows="2" />

            <q-btn type="submit" color="primary" label="CRIAR LOTE" unelevated class="full-width q-mt-sm" :loading="criando" />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog: Editar Lote -->
    <q-dialog v-model="editarOpen" :maximized="$q.screen.xs">
      <q-card class="form-card">
        <q-card-section class="row items-center bg-primary text-white q-py-sm">
          <q-icon name="edit" size="sm" class="q-mr-sm" />
          <div class="text-h6">Editar Lote</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md scroll" style="max-height: 70vh">
          <q-form @submit="salvarEdicao" class="q-gutter-sm">
            <q-input v-model="formEdicao.nome" label="NOME DO LOTE *" outlined dense :rules="[v => !!v || 'Obrigatório']" />

            <div class="row q-gutter-sm">
              <q-input v-model="formEdicao.codigo" label="CÓDIGO INTERNO" outlined dense class="col" />
              <q-input v-model="formEdicao.localizacao" label="LOCALIZAÇÃO" outlined dense class="col" />
            </div>

            <div class="row q-gutter-sm">
              <q-select
                v-model="formEdicao.finalidade"
                :options="finalidades"
                label="FINALIDADE"
                outlined dense class="col"
                emit-value map-options
              />
              <q-select
                v-model="formEdicao.fase"
                :options="fases"
                label="FASE"
                outlined dense class="col"
                emit-value map-options
              />
            </div>

            <div class="form-section-label q-mt-sm">QUANTIDADE DE ANIMAIS</div>
            <q-input
              v-model.number="formEdicao.qtdAtual"
              type="number" label="CABEÇAS ATUAIS *"
              outlined dense
              :rules="[v => v >= 0 || 'Não pode ser negativo']"
              :hint="`Entrada: ${loteEditando?.qtdInicial} · Atual registrado: ${loteEditando?.qtdAtual}`"
            />

            <q-input v-model="formEdicao.observacao" label="OBSERVAÇÃO" outlined dense type="textarea" rows="2" />

            <q-btn type="submit" color="primary" label="SALVAR ALTERAÇÕES" icon="save" unelevated class="full-width q-mt-sm" :loading="salvandoEdicao" />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog: KPIs (grade) -->
    <q-dialog v-model="dialogKPIs">
      <q-card class="kpi-dialog">
        <q-card-section class="bg-primary text-white row items-center q-py-sm">
          <q-icon name="bar_chart" size="sm" class="q-mr-sm" />
          <div class="text-h6">KPIs — {{ kpiLote?.nome }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div v-if="!kpiData" class="text-center q-py-lg">
            <q-spinner color="primary" />
          </div>
          <div v-else class="kpi-grid-sm">
            <div class="kpi-card-sm">
              <div class="kv">{{ kpiData.gmdKgDia?.toFixed(3) ?? '—' }}</div>
              <div class="kl">GMD (kg/dia)</div>
            </div>
            <div class="kpi-card-sm">
              <div class="kv">{{ kpiData.conversaoAlimentar ?? '—' }}</div>
              <div class="kl">Conversão Alimentar</div>
            </div>
            <div class="kpi-card-sm">
              <div class="kv">{{ kpiData.consumoRacaoKgDia?.toFixed(1) ?? '—' }}</div>
              <div class="kl">Ração/dia (kg)</div>
            </div>
            <div class="kpi-card-sm">
              <div class="kv">{{ kpiData.taxaMortalidade?.toFixed(1) ?? '0' }}%</div>
              <div class="kl">Mortalidade</div>
            </div>
            <div class="kpi-card-sm">
              <div class="kv">{{ kpiData.diasConfinamento }}</div>
              <div class="kl">Dias confinamento</div>
            </div>
            <div class="kpi-card-sm">
              <div class="kv">R$ {{ kpiData.custoPorCabecaDia?.toFixed(2) ?? '0,00' }}</div>
              <div class="kl">Custo/cabeça/dia</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useLotesStore } from 'src/stores/lotes.store'
import { useAuthStore } from 'src/stores/auth.store'
import { useEspecies, ESPECIES } from 'src/composables/useEspecies'

const $q = useQuasar()
const lotesStore = useLotesStore()
const authStore = useAuthStore()
const { getEmoji, getLabel } = useEspecies()

const visao = ref<'grade' | 'individual'>('grade')
const especieFiltro = ref('')
const abrirForm = ref(false)
const criando = ref(false)
const dialogKPIs = ref(false)
const kpiLote = ref<any>(null)
const kpiData = ref<any>(null)

const editarOpen = ref(false)
const salvandoEdicao = ref(false)
const loteEditando = ref<any>(null)
const formEdicao = ref({
  nome: '', codigo: '', finalidade: '', fase: '', localizacao: '',
  qtdAtual: 0, observacao: '',
})

const loteSelecionado = ref<any>(null)
const kpiIndividual = ref<any>(null)
const kpiCarregando = ref(false)

const novoLote = ref({
  nome: '', codigo: '', especie: 'bovino', finalidade: 'corte',
  fase: 'engorda', localizacao: '',
  qtdInicial: null as number | null,
  pesoMedioEntrada: null as number | null,
  dataEntrada: new Date().toISOString().split('T')[0],
  observacao: '',
})

const finalidades = [
  { label: 'CORTE',        value: 'corte' },
  { label: 'LEITE',        value: 'leite' },
  { label: 'REPRODUÇÃO',   value: 'reproducao' },
  { label: 'POSTURA',      value: 'postura' },
  { label: 'ESPORTE',      value: 'esporte' },
  { label: 'TRABALHO',     value: 'trabalho' },
  { label: 'PISCICULTURA', value: 'piscicultura' },
  { label: 'ALEVINAGEM',   value: 'alevinagem' },
]

const fases = [
  { label: 'CRIA',              value: 'cria' },
  { label: 'RECRIA',            value: 'recria' },
  { label: 'ENGORDA',           value: 'engorda' },
  { label: 'TERMINAÇÃO',        value: 'terminacao' },
  { label: 'MATERNIDADE',       value: 'maternidade' },
  { label: 'CRECHE',            value: 'creche' },
  { label: 'PRODUÇÃO',          value: 'producao' },
  { label: 'ALEVINAGEM',        value: 'alevinagem' },
  { label: 'CRESCIMENTO',       value: 'crescimento' },
  { label: 'ENGORDA (PEIXES)',   value: 'engorda_peixes' },
]

const especiesNosLotes = computed(() => {
  const unicas = [...new Set(lotesStore.lotesAtivos.map(l => l.especie))]
  return unicas.map(e => ({ valor: e, emoji: getEmoji(e), label: getLabel(e) }))
})

const lotesFiltrados = computed(() =>
  especieFiltro.value
    ? lotesStore.lotesAtivos.filter(l => l.especie === especieFiltro.value)
    : lotesStore.lotesAtivos
)

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

function diasConfinamento(dataEntrada: string) {
  return Math.floor((Date.now() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24))
}

function faseColor(fase?: string) {
  const map: Record<string, string> = {
    cria: 'teal', recria: 'blue', engorda: 'green', terminacao: 'orange',
    maternidade: 'pink', creche: 'purple', producao: 'cyan',
  }
  return map[fase ?? ''] ?? 'grey'
}

function mudarParaIndividual() {
  visao.value = 'individual'
  if (!loteSelecionado.value && lotesFiltrados.value.length) {
    selecionarLote(lotesFiltrados.value[0]!)
  }
}

async function selecionarLote(lote: any) {
  loteSelecionado.value = lote
  kpiIndividual.value = null
  await carregarKPIIndividual()
}

async function carregarKPIIndividual() {
  if (!loteSelecionado.value) return
  kpiCarregando.value = true
  try {
    kpiIndividual.value = await lotesStore.buscarKPIs(loteSelecionado.value.id)
  } finally {
    kpiCarregando.value = false
  }
}

async function criarLote() {
  criando.value = true
  try {
    await lotesStore.criar(novoLote.value as any)
    abrirForm.value = false
    $q.notify({ type: 'positive', message: 'Lote criado com sucesso!' })
    novoLote.value = {
      nome: '', codigo: '', especie: 'bovino', finalidade: 'corte', fase: 'engorda',
      localizacao: '', qtdInicial: null, pesoMedioEntrada: null,
      dataEntrada: new Date().toISOString().split('T')[0], observacao: '',
    }
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao criar lote' })
  } finally {
    criando.value = false
  }
}

async function verKPIs(lote: any) {
  kpiLote.value = lote
  kpiData.value = null
  dialogKPIs.value = true
  kpiData.value = await lotesStore.buscarKPIs(lote.id)
}

function abrirEdicao(lote: any) {
  loteEditando.value = lote
  formEdicao.value = {
    nome: lote.nome ?? '',
    codigo: lote.codigo ?? '',
    finalidade: lote.finalidade ?? '',
    fase: lote.fase ?? '',
    localizacao: lote.localizacao ?? '',
    qtdAtual: lote.qtdAtual,
    observacao: lote.observacao ?? '',
  }
  editarOpen.value = true
}

async function salvarEdicao() {
  if (!loteEditando.value) return
  salvandoEdicao.value = true
  try {
    const atualizado = await lotesStore.atualizar(loteEditando.value.id, formEdicao.value)
    if (loteSelecionado.value?.id === loteEditando.value.id) {
      loteSelecionado.value = atualizado
    }
    editarOpen.value = false
    $q.notify({ type: 'positive', message: 'Lote atualizado com sucesso!' })
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao atualizar lote' })
  } finally {
    salvandoEdicao.value = false
  }
}

function encerrarLote(lote: any) {
  $q.dialog({
    title: 'Encerrar lote',
    message: `Tem certeza que deseja encerrar "${lote.nome}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Encerrar', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(async () => {
    await lotesStore.encerrar(lote.id)
    if (loteSelecionado.value?.id === lote.id) loteSelecionado.value = null
    $q.notify({ type: 'positive', message: 'Lote encerrado' })
  })
}

onMounted(() => lotesStore.carregar())
</script>

<style scoped>
/* ── Header ─────────────────────────────────────────────────────── */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.visao-toggle {
  display: flex;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 2px;
  gap: 2px;
}

/* ── Grade ──────────────────────────────────────────────────────── */
.lotes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.lote-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
  transition: box-shadow .2s, transform .15s;
}
.lote-card:hover { box-shadow: 0 5px 20px rgba(0,0,0,.11); transform: translateY(-1px); }

.lote-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 10px;
}
.lote-badge {
  width: 44px; height: 44px;
  background: #f1f8e9;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; flex-shrink: 0;
}
.lote-info { flex: 1; min-width: 0; }
.lote-nome { font-weight: 600; font-size: .95rem; color: #1b5e20; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lote-sub  { font-size: .72rem; color: #888; margin-top: 1px; }

.lote-metrics {
  display: flex; align-items: center;
  padding: 10px 14px;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}
.metric { flex: 1; text-align: center; }
.metric-div { width: 1px; height: 28px; background: #eee; flex-shrink: 0; }
.metric .val { font-weight: 700; font-size: 1.1rem; color: #1b5e20; }
.metric .lbl { font-size: .62rem; color: #aaa; text-transform: uppercase; margin-top: 1px; }

.lote-chips { padding: 10px 14px; }

/* ── Individual ─────────────────────────────────────────────────── */
.individual-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 767px) {
  .individual-layout { grid-template-columns: 1fr; }
}

.lista-panel {
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
  overflow: hidden;
  position: sticky;
  top: 70px;
}
.lista-title {
  padding: 12px 14px 8px;
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .7px;
  color: #558b2f;
  border-bottom: 1px solid #f5f5f5;
}
.lista-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f8f8f8;
  transition: background .15s;
}
.lista-item:last-child { border-bottom: none; }
.lista-item:hover  { background: #f9fbe7; }
.lista-item.ativo  { background: #e8f5e9; border-left: 3px solid #2e7d32; padding-left: 11px; }
.li-badge { font-size: 1.3rem; flex-shrink: 0; }
.li-body  { flex: 1; min-width: 0; }
.li-nome  { font-weight: 600; font-size: .85rem; color: #1b5e20; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.li-sub   { font-size: .68rem; color: #aaa; }
.li-fase  { flex-shrink: 0; }

.detalhe-panel {
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
  padding: 20px 24px;
  min-height: 300px;
}

.detalhe-vazio {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 60px 20px;
  color: #bbb;
}
.dv-icon { font-size: 2.5rem; margin-bottom: 10px; }
.dv-msg  { font-size: .9rem; }

.detalhe-header {
  display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px;
}
.dh-badge {
  width: 52px; height: 52px;
  background: #f1f8e9; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; flex-shrink: 0;
}
.dh-info  { flex: 1; min-width: 0; }
.dh-nome  { font-size: 1.2rem; font-weight: 700; color: #1b5e20; }
.dh-sub   { font-size: .78rem; color: #888; margin-top: 2px; }
.dh-acoes { display: flex; gap: 4px; flex-shrink: 0; }

.detalhe-metricas {
  display: flex; align-items: center;
  background: #f9fbe7; border-radius: 12px;
  padding: 14px 16px; margin-bottom: 14px;
  flex-wrap: wrap; gap: 4px;
}
.dm-item  { flex: 1; text-align: center; min-width: 70px; }
.dm-div   { width: 1px; height: 32px; background: #dce8cc; flex-shrink: 0; }
.dm-val   { font-weight: 700; font-size: 1.15rem; color: #1b5e20; }
.dm-unit  { font-size: .75rem; font-weight: 400; }
.dm-lbl   { font-size: .62rem; color: #888; text-transform: uppercase; margin-top: 1px; }

.detalhe-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }

.detalhe-kpi-titulo {
  font-size: .66rem; font-weight: 700; letter-spacing: .7px;
  color: #558b2f; margin-bottom: 12px;
}
.kpi-vazio { padding: 12px 0; }

.detalhe-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 599px) { .detalhe-kpis { grid-template-columns: repeat(2, 1fr); } }

.dk-item {
  background: #f9fbe7; border-radius: 10px;
  padding: 12px 14px; border-left: 3px solid #2e7d32;
}
.dk-val { font-size: 1.15rem; font-weight: 700; color: #333; }
.dk-lbl { font-size: .65rem; color: #888; text-transform: uppercase; margin-top: 2px; }

.detalhe-obs {
  background: #fafafa; border-radius: 10px;
  padding: 12px 14px; border-left: 3px solid #bbb;
}
.obs-label { font-size: .65rem; font-weight: 700; color: #aaa; text-transform: uppercase; margin-bottom: 4px; }
.obs-texto { font-size: .88rem; color: #555; }

/* ── Dialogs ─────────────────────────────────────────────────────── */
.form-section-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f; margin-bottom: 8px;
}
.especie-btn-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 4px;
}
.especie-btn { width: 100%; border-radius: 8px !important; font-size: .78rem !important; }
.form-card { width: 520px; max-width: 100%; }

.kpi-dialog { width: 480px; max-width: 100%; }
.kpi-grid-sm { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.kpi-card-sm { background: #f9fbe7; border-radius: 10px; padding: 12px; border-left: 3px solid #2e7d32; }
.kpi-card-sm .kv { font-size: 1.3rem; font-weight: 700; color: #2e7d32; }
.kpi-card-sm .kl { font-size: .68rem; color: #888; text-transform: uppercase; margin-top: 2px; }

/* ── Misc ────────────────────────────────────────────────────────── */
.chip-scroll { overflow-x: auto; }
.chip-bar { display: flex; gap: 8px; flex-wrap: wrap; }

.empty-state {
  text-align: center; padding: 60px 20px;
  background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.empty-icon { font-size: 3rem; margin-bottom: 8px; }
.empty-msg  { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
