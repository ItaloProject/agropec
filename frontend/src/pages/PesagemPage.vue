<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Pesagem</h1>
        <div class="page-subtitle">GMD calculado automaticamente</div>
      </div>
      <div class="tab-switch">
        <button class="tab-btn" :class="{ active: guia === 'lote' }" @click="guia = 'lote'">
          POR LOTE
        </button>
        <button class="tab-btn" :class="{ active: guia === 'unidade' }" @click="guia = 'unidade'">
          POR UNIDADE
        </button>
      </div>
    </div>

    <!-- ════ PESAGEM POR LOTE ════════════════════════════════════════ -->
    <div v-show="guia === 'lote'" class="pesagem-layout">
      <!-- ── Formulário (esquerda) ─────────────────────────────── -->
      <div class="form-col">
        <div class="form-card">
          <div class="form-card-title">REGISTRAR PESAGEM POR LOTE</div>

          <q-form @submit="registrar" class="q-gutter-sm">
            <div class="form-label">LOTE</div>

            <div
              v-for="lote in lotesStore.lotesAtivos" :key="lote.id"
              class="select-item" :class="{ selected: form.loteId === lote.id }"
              @click="selecionarLote(lote)"
            >
              <span class="select-emoji">{{ getEmoji(lote.especie) }}</span>
              <div class="select-body">
                <div class="select-name">{{ lote.nome }}</div>
                <div class="select-sub">{{ lote.qtdAtual }} animais · Peso atual: {{ lote.pesoMedioAtual?.toFixed(1) ?? '—' }} kg</div>
              </div>
              <div class="select-right">
                <q-icon v-if="form.loteId === lote.id" name="check_circle" color="primary" />
                <div v-else-if="diasSemPesar(lote.id) !== null" class="dias-badge" :class="diasSemPesarClass(lote.id)">
                  {{ diasSemPesar(lote.id) }}d
                </div>
              </div>
            </div>

            <div v-if="!lotesStore.lotesAtivos.length" class="empty-step">
              Nenhum lote ativo.
            </div>

            <!-- Evolução do lote selecionado -->
            <div v-if="evolucaoLote.length" class="evolucao-box">
              <div class="evolucao-titulo">ÚLTIMAS PESAGENS — {{ loteSel?.nome }}</div>
              <div v-for="p in evolucaoLote" :key="p.id" class="evolucao-row">
                <span class="ev-data">{{ formatarDataHora(p.criadoEm) }}</span>
                <span class="ev-qtd">{{ p.qtdPesada ? p.qtdPesada + ' cab' : '—' }}</span>
                <span class="ev-peso">{{ p.pesoKg.toFixed(1) }} kg</span>
                <span v-if="p.gmdGDia" class="ev-gmd" :class="p.gmdGDia >= 0 ? 'gmd-ok' : 'gmd-neg'">
                  {{ p.gmdGDia >= 0 ? '+' : '' }}{{ p.gmdGDia.toFixed(0) }} g/d
                </span>
                <span v-else class="ev-gmd text-grey-5">—</span>
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-sm">
              <q-input
                v-model.number="form.pesoKg"
                type="number" label="PESO MÉDIO (KG) *"
                outlined dense class="col"
                :rules="[v => v > 0 || 'Obrigatório']"
                step="0.1"
              />
              <q-input
                v-model.number="form.qtdPesada"
                type="number" label="QTD PESADA"
                outlined dense class="col"
              />
            </div>

            <q-input v-model="form.data" type="date" label="DATA *" outlined dense />
            <q-input v-model="form.responsavel" label="RESPONSÁVEL" outlined dense />
            <q-input v-model="form.observacao" label="OBSERVAÇÃO" outlined dense />

            <!-- Estimativa GMD -->
            <div v-if="estimativaGMD" class="gmd-box">
              <div class="gmd-row">
                <span>Peso anterior</span>
                <strong>{{ estimativaGMD.pesoAnterior.toFixed(1) }} kg</strong>
              </div>
              <div class="gmd-row">
                <strong :class="estimativaGMD.gmd >= 0 ? 'text-primary' : 'text-negative'">GMD ESTIMADO</strong>
                <strong :class="estimativaGMD.gmd >= 0 ? 'text-primary' : 'text-negative'">
                  {{ estimativaGMD.gmd >= 0 ? '+' : '' }}{{ estimativaGMD.gmd.toFixed(0) }} g/dia
                </strong>
              </div>
            </div>

            <q-btn
              type="submit" color="primary" label="REGISTRAR PESAGEM"
              icon="scale" unelevated no-caps class="full-width q-mt-sm"
              :loading="salvando" :disable="!form.loteId || !form.pesoKg"
            />
          </q-form>
        </div>
      </div>

      <!-- ── Histórico (direita) ────────────────────────────────── -->
      <div class="hist-col">

        <!-- Resumo geral -->
        <div v-if="resumoGeral.totalPesagens > 0" class="resumo-card q-mb-md">
          <div class="rg-item">
            <div class="rg-val">{{ resumoGeral.totalPesagens }}</div>
            <div class="rg-lbl">Pesagens</div>
          </div>
          <div class="rg-div" />
          <div class="rg-item">
            <div class="rg-val" :class="resumoGeral.gmdMedio >= 0 ? 'text-positive' : 'text-negative'">
              {{ resumoGeral.gmdMedio >= 0 ? '+' : '' }}{{ resumoGeral.gmdMedio.toFixed(0) }} g/d
            </div>
            <div class="rg-lbl">GMD médio</div>
          </div>
          <div v-if="resumoGeral.melhorLote" class="rg-div" />
          <div v-if="resumoGeral.melhorLote" class="rg-item">
            <div class="rg-val rg-lote text-positive">{{ resumoGeral.melhorLote }}</div>
            <div class="rg-lbl">Melhor GMD</div>
          </div>
          <div v-if="resumoGeral.piorLote" class="rg-div" />
          <div v-if="resumoGeral.piorLote" class="rg-item">
            <div class="rg-val rg-lote text-negative">{{ resumoGeral.piorLote }}</div>
            <div class="rg-lbl">Pior GMD</div>
          </div>
        </div>

        <!-- Alertas de lotes sem pesagem recente -->
        <div v-if="alertasSemPesar.length" class="alertas-wrap q-mb-md">
          <div v-for="a in alertasSemPesar" :key="a.loteId" class="alerta-item">
            <q-icon name="warning" color="warning" size="xs" />
            <span>{{ a.nome }} — <strong>{{ a.dias }} dias</strong> sem pesagem</span>
          </div>
        </div>

        <div class="hist-header">
          <div class="hist-title">HISTÓRICO DE PESAGENS</div>
          <q-btn flat round icon="refresh" size="sm" @click="carregar" :loading="carregando" />
        </div>

        <!-- Filtro por lote -->
        <div class="filtro-chips q-mb-md">
          <div
            class="filtro-chip" :class="{ active: filtroLoteId === null }"
            @click="filtroLoteId = null"
          >Todos</div>
          <div
            v-for="lote in lotesNoHistorico" :key="lote.id"
            class="filtro-chip" :class="{ active: filtroLoteId === lote.id }"
            @click="filtroLoteId = lote.id"
          >{{ getEmoji(lote.especie) }} {{ lote.nome }}</div>
        </div>

        <div v-if="carregando" class="q-py-xl text-center">
          <q-spinner color="primary" />
        </div>

        <div v-else-if="!pesagensFiltradas.length" class="empty-state">
          <div class="empty-icon">⚖️</div>
          <div class="empty-msg">Nenhuma pesagem registrada</div>
        </div>

        <div v-else class="hist-list">
          <div v-for="p in pesagensFiltradas" :key="p.id" class="pesagem-item">
            <div class="pi-left">
              <div class="pi-emoji">{{ getEmoji(p.lote?.especie) }}</div>
              <div>
                <div class="pi-nome">{{ p.lote?.nome }}</div>
                <div class="pi-sub">
                  {{ formatarDataHora(p.criadoEm) }}
                  <span v-if="p.qtdPesada"> · {{ p.qtdPesada }} cab. pesadas</span>
                  <span v-if="p.responsavel"> · {{ p.responsavel }}</span>
                </div>
              </div>
            </div>
            <div class="pi-right">
              <div class="pi-peso">{{ p.pesoKg.toFixed(1) }} kg</div>
              <div v-if="p.gmdGDia" class="pi-gmd" :class="p.gmdGDia >= 0 ? 'gmd-ok' : 'gmd-neg'">
                GMD {{ p.gmdGDia >= 0 ? '+' : '' }}{{ p.gmdGDia.toFixed(0) }} g/dia
              </div>
              <div v-if="p.variacaoPct" class="pi-var">
                {{ p.variacaoPct >= 0 ? '+' : '' }}{{ p.variacaoPct.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ════ PESAGEM POR UNIDADE ════════════════════════════════════ -->
    <div v-show="guia === 'unidade'" class="pesagem-layout">
      <!-- ── Formulário (esquerda) ─────────────────────────────── -->
      <div class="form-col">
        <div class="form-card">
          <div class="form-card-title">REGISTRAR PESAGEM INDIVIDUAL</div>

          <q-form @submit="registrarUnidade" class="q-gutter-sm">
            <div class="form-label">1. SELECIONAR LOTE</div>

            <div
              v-for="lote in lotesStore.lotesAtivos" :key="lote.id"
              class="select-item" :class="{ selected: formU.loteId === lote.id }"
              @click="selecionarLoteUnidade(lote)"
            >
              <span class="select-emoji">{{ getEmoji(lote.especie) }}</span>
              <div class="select-body">
                <div class="select-name">{{ lote.nome }}</div>
                <div class="select-sub">{{ lote.qtdAtual }} animais</div>
              </div>
              <div class="select-right">
                <q-icon v-if="formU.loteId === lote.id" name="check_circle" color="primary" />
              </div>
            </div>

            <template v-if="formU.loteId">
              <div class="form-label q-mt-sm">2. SELECIONAR ANIMAL</div>

              <div v-if="carregandoAnimais" class="text-center q-py-md">
                <q-spinner color="primary" size="sm" />
              </div>
              <div v-else-if="!animaisLote.length" class="empty-step">
                Nenhum animal cadastrado neste lote.<br>
                <span class="text-caption text-grey">Cadastre animais na página de Animais.</span>
              </div>
              <div
                v-for="a in animaisLote" :key="a.id"
                class="select-item" :class="{ selected: formU.animalId === a.id }"
                @click="selecionarAnimal(a)"
              >
                <span class="select-emoji">{{ a.sexo === 'femea' ? '♀' : a.sexo === 'macho' ? '♂' : '·' }}</span>
                <div class="select-body">
                  <div class="select-name">{{ a.brinco ? 'BRINCO #' + a.brinco : 'SEM BRINCO' }}</div>
                  <div class="select-sub">
                    {{ a.raca ?? '—' }}
                    <span v-if="a.pesoEntrada"> · Entrada: {{ a.pesoEntrada.toFixed(1) }} kg</span>
                  </div>
                </div>
                <div class="select-right">
                  <q-icon v-if="formU.animalId === a.id" name="check_circle" color="primary" />
                </div>
              </div>
            </template>

            <!-- Evolução do animal selecionado -->
            <div v-if="evolucaoAnimal.length" class="evolucao-box">
              <div class="evolucao-titulo">
                ÚLTIMAS PESAGENS — {{ animalSelecionado?.brinco ? 'BRINCO #' + animalSelecionado.brinco : 'ANIMAL' }}
              </div>
              <div v-for="p in evolucaoAnimal" :key="p.id" class="evolucao-row">
                <span class="ev-data">{{ formatarDataHora(p.criadoEm) }}</span>
                <span class="ev-peso">{{ p.pesoKg.toFixed(1) }} kg</span>
                <span v-if="p.gmdGDia" class="ev-gmd" :class="p.gmdGDia >= 0 ? 'gmd-ok' : 'gmd-neg'">
                  {{ p.gmdGDia >= 0 ? '+' : '' }}{{ p.gmdGDia.toFixed(0) }} g/d
                </span>
                <span v-else class="ev-gmd text-grey-5">—</span>
              </div>
            </div>

            <q-input
              v-model.number="formU.pesoKg"
              type="number" label="PESO (KG) *"
              outlined dense
              :rules="[v => v > 0 || 'Obrigatório']"
              step="0.1"
            />
            <q-input v-model="formU.data" type="date" label="DATA *" outlined dense />
            <q-input v-model="formU.responsavel" label="RESPONSÁVEL" outlined dense />
            <q-input v-model="formU.observacao" label="OBSERVAÇÃO" outlined dense />

            <q-btn
              type="submit" color="primary" label="REGISTRAR PESAGEM"
              icon="scale" unelevated no-caps class="full-width q-mt-sm"
              :loading="salvandoU" :disable="!formU.animalId || !formU.pesoKg"
            />
          </q-form>
        </div>
      </div>

      <!-- ── Histórico (direita) ────────────────────────────────── -->
      <div class="hist-col">
        <div class="hist-header">
          <div class="hist-title">HISTÓRICO — PESAGEM POR UNIDADE</div>
          <q-btn flat round icon="refresh" size="sm" @click="carregar" :loading="carregando" />
        </div>

        <!-- Filtro por lote -->
        <div class="filtro-chips q-mb-md">
          <div
            class="filtro-chip" :class="{ active: filtroLoteIdU === null }"
            @click="filtroLoteIdU = null"
          >Todos</div>
          <div
            v-for="lote in lotesNoHistoricoU" :key="lote.id"
            class="filtro-chip" :class="{ active: filtroLoteIdU === lote.id }"
            @click="filtroLoteIdU = lote.id"
          >{{ getEmoji(lote.especie) }} {{ lote.nome }}</div>
        </div>

        <div v-if="carregando" class="q-py-xl text-center">
          <q-spinner color="primary" />
        </div>

        <div v-else-if="!pesagensUnidadeFiltradas.length" class="empty-state">
          <div class="empty-icon">🐄</div>
          <div class="empty-msg">Nenhuma pesagem individual registrada</div>
        </div>

        <div v-else class="hist-list">
          <div v-for="p in pesagensUnidadeFiltradas" :key="p.id" class="pesagem-item">
            <div class="pi-left">
              <div class="pi-emoji">{{ getEmoji(p.lote?.especie) }}</div>
              <div>
                <div class="pi-nome">
                  {{ p.animal?.brinco ? 'BRINCO #' + p.animal.brinco : 'SEM BRINCO' }}
                </div>
                <div class="pi-sub">
                  {{ p.lote?.nome }} · {{ formatarDataHora(p.criadoEm) }}
                  <span v-if="p.animal?.raca"> · {{ p.animal.raca }}</span>
                  <span v-if="p.responsavel"> · {{ p.responsavel }}</span>
                </div>
              </div>
            </div>
            <div class="pi-right">
              <div class="pi-pesos-row">
                <div class="pi-peso-bloco">
                  <div class="pi-peso-label">ANIMAL</div>
                  <div class="pi-peso">{{ p.pesoKg.toFixed(1) }} kg</div>
                </div>
                <div v-if="p.lote?.pesoMedioAtual" class="pi-sep">vs</div>
                <div v-if="p.lote?.pesoMedioAtual" class="pi-peso-bloco pi-lote-bloco">
                  <div class="pi-peso-label">LOTE ⌀</div>
                  <div class="pi-lote-peso">{{ p.lote.pesoMedioAtual.toFixed(1) }} kg</div>
                </div>
              </div>
              <div v-if="p.gmdGDia" class="pi-gmd" :class="p.gmdGDia >= 0 ? 'gmd-ok' : 'gmd-neg'">
                GMD {{ p.gmdGDia >= 0 ? '+' : '' }}{{ p.gmdGDia.toFixed(0) }} g/dia
              </div>
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
import { useEspecies } from 'src/composables/useEspecies'

const $q = useQuasar()
const lotesStore = useLotesStore()
const { getEmoji } = useEspecies()

// ── Estado compartilhado ─────────────────────────────────────────
const guia = ref<'lote' | 'unidade'>('lote')
const pesagens = ref<any[]>([])
const carregando = ref(false)

// ── Split por tipo ────────────────────────────────────────────────
const pesagensPorLote = computed(() => pesagens.value.filter(p => !p.animalId))
const pesagensPorUnidade = computed(() => pesagens.value.filter(p => p.animalId))

// ────────────────────────────────────────────────────────────────
// GUIA 1 — POR LOTE
// ────────────────────────────────────────────────────────────────

const loteSel = ref<any>(null)
const filtroLoteId = ref<number | null>(null)
const salvando = ref(false)

const form = ref({
  loteId: null as number | null,
  data: new Date().toISOString().split('T')[0],
  pesoKg: null as number | null,
  qtdPesada: null as number | null,
  responsavel: '',
  observacao: '',
})

const ultimaPesagemPorLote = computed(() => {
  const map = new Map<number, string>()
  pesagensPorLote.value.forEach(p => {
    if (!p.loteId) return
    const atual = map.get(p.loteId)
    if (!atual || p.data > atual) map.set(p.loteId, p.data)
  })
  return map
})

function diasSemPesar(loteId: number): number | null {
  const ultima = ultimaPesagemPorLote.value.get(loteId)
  if (!ultima) return null
  return Math.floor((Date.now() - new Date(ultima + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
}

function diasSemPesarClass(loteId: number): string {
  const d = diasSemPesar(loteId)
  if (d === null) return ''
  if (d > 30) return 'dias-critico'
  if (d > 15) return 'dias-atencao'
  return 'dias-ok'
}

const alertasSemPesar = computed(() => {
  return lotesStore.lotesAtivos
    .map(l => ({ loteId: l.id, nome: l.nome, dias: diasSemPesar(l.id) }))
    .filter(a => a.dias !== null && a.dias > 15) as { loteId: number; nome: string; dias: number }[]
})

const evolucaoLote = computed(() => {
  if (!form.value.loteId) return []
  return pesagensPorLote.value
    .filter(p => p.loteId === form.value.loteId)
    .slice(0, 5)
})

const lotesNoHistorico = computed(() => {
  const map = new Map<number, any>()
  pesagensPorLote.value.forEach(p => {
    if (p.lote && !map.has(p.lote.id)) map.set(p.lote.id, p.lote)
  })
  return [...map.values()]
})

const pesagensFiltradas = computed(() =>
  filtroLoteId.value !== null
    ? pesagensPorLote.value.filter(p => p.loteId === filtroLoteId.value)
    : pesagensPorLote.value
)

const resumoGeral = computed(() => {
  const comGMD = pesagensPorLote.value.filter(p => p.gmdGDia !== null && p.gmdGDia !== undefined)
  if (!comGMD.length) return { totalPesagens: pesagensPorLote.value.length, gmdMedio: 0, melhorLote: null, piorLote: null }

  const gmdMedio = comGMD.reduce((s, p) => s + p.gmdGDia, 0) / comGMD.length

  const porLote = new Map<number, { nome: string; soma: number; count: number }>()
  comGMD.forEach(p => {
    if (!p.loteId) return
    const entry = porLote.get(p.loteId) ?? { nome: p.lote?.nome ?? '?', soma: 0, count: 0 }
    entry.soma += p.gmdGDia
    entry.count++
    porLote.set(p.loteId, entry)
  })

  let melhor: { nome: string; gmd: number } | null = null
  let pior:   { nome: string; gmd: number } | null = null

  porLote.forEach(v => {
    const gmd = v.soma / v.count
    if (!melhor || gmd > melhor.gmd) melhor = { nome: v.nome, gmd }
    if (!pior   || gmd < pior.gmd)   pior   = { nome: v.nome, gmd }
  })

  return {
    totalPesagens: pesagensPorLote.value.length,
    gmdMedio,
    melhorLote: porLote.size > 1 ? melhor?.nome ?? null : null,
    piorLote:   porLote.size > 1 ? pior?.nome   ?? null : null,
  }
})

const estimativaGMD = computed(() => {
  if (!loteSel.value || !form.value.pesoKg || !form.value.data) return null
  const pesoAnterior = loteSel.value.pesoMedioAtual ?? loteSel.value.pesoMedioEntrada
  if (!pesoAnterior) return null
  const dataRef = new Date(loteSel.value.dataEntrada)
  const dataNova = new Date(form.value.data)
  const dias = Math.floor((dataNova.getTime() - dataRef.getTime()) / (1000 * 60 * 60 * 24))
  if (dias <= 0) return null
  return {
    pesoAnterior,
    gmd: ((form.value.pesoKg - pesoAnterior) / dias) * 1000,
  }
})

function selecionarLote(lote: any) {
  form.value.loteId = lote.id
  loteSel.value = lote
}

async function registrar() {
  if (!form.value.loteId || !form.value.pesoKg) return
  salvando.value = true
  try {
    const res = await api.post('/pesagens', form.value)
    const gmd = res.data.gmdGDia
    $q.notify({
      type: 'positive',
      message: 'Pesagem registrada!',
      caption: gmd ? `GMD calculado: ${gmd >= 0 ? '+' : ''}${gmd.toFixed(0)} g/dia` : undefined,
    })
    form.value = {
      loteId: null, data: new Date().toISOString().split('T')[0],
      pesoKg: null, qtdPesada: null, responsavel: '', observacao: '',
    }
    loteSel.value = null
    await Promise.all([carregar(), lotesStore.carregar()])
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar pesagem' })
  } finally {
    salvando.value = false
  }
}

// ────────────────────────────────────────────────────────────────
// GUIA 2 — POR UNIDADE
// ────────────────────────────────────────────────────────────────

const animalSelecionado = ref<any>(null)
const animaisLote = ref<any[]>([])
const carregandoAnimais = ref(false)
const salvandoU = ref(false)
const filtroLoteIdU = ref<number | null>(null)

const formU = ref({
  loteId: null as number | null,
  animalId: null as number | null,
  data: new Date().toISOString().split('T')[0],
  pesoKg: null as number | null,
  responsavel: '',
  observacao: '',
})

const lotesNoHistoricoU = computed(() => {
  const map = new Map<number, any>()
  pesagensPorUnidade.value.forEach(p => {
    if (p.lote && !map.has(p.lote.id)) map.set(p.lote.id, p.lote)
  })
  return [...map.values()]
})

const pesagensUnidadeFiltradas = computed(() =>
  filtroLoteIdU.value !== null
    ? pesagensPorUnidade.value.filter(p => p.loteId === filtroLoteIdU.value)
    : pesagensPorUnidade.value
)

const evolucaoAnimal = computed(() => {
  if (!formU.value.animalId) return []
  return pesagensPorUnidade.value
    .filter(p => p.animalId === formU.value.animalId)
    .slice(0, 5)
})

async function selecionarLoteUnidade(lote: any) {
  formU.value.loteId = lote.id
  formU.value.animalId = null
  animalSelecionado.value = null
  animaisLote.value = []
  carregandoAnimais.value = true
  try {
    const res = await api.get(`/animais?loteId=${lote.id}`)
    animaisLote.value = res.data
  } finally {
    carregandoAnimais.value = false
  }
}

function selecionarAnimal(a: any) {
  formU.value.animalId = a.id
  animalSelecionado.value = a
}

async function registrarUnidade() {
  if (!formU.value.animalId || !formU.value.pesoKg) return
  salvandoU.value = true
  try {
    const res = await api.post('/pesagens', formU.value)
    const gmd = res.data.gmdGDia
    $q.notify({
      type: 'positive',
      message: 'Pesagem individual registrada!',
      caption: gmd ? `GMD: ${gmd >= 0 ? '+' : ''}${gmd.toFixed(0)} g/dia` : undefined,
    })
    formU.value = {
      loteId: formU.value.loteId, animalId: null,
      data: new Date().toISOString().split('T')[0],
      pesoKg: null, responsavel: '', observacao: '',
    }
    animalSelecionado.value = null
    await Promise.all([carregar(), lotesStore.carregar()])
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar pesagem' })
  } finally {
    salvandoU.value = false
  }
}

// ── Compartilhado ────────────────────────────────────────────────

function formatarDataHora(criadoEm: string) {
  if (!criadoEm) return ''
  const d = new Date(criadoEm.replace(' ', 'T') + 'Z')
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

async function carregar() {
  carregando.value = true
  try {
    pesagens.value = await api.get('/pesagens?limite=100').then(r => r.data)
  } finally {
    carregando.value = false
  }
}

onMounted(async () => {
  await Promise.all([lotesStore.carregar(), carregar()])
})
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────── */
.pesagem-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 899px) {
  .pesagem-layout { grid-template-columns: 1fr; }
}

/* ── Tab switch ──────────────────────────────────────────────── */
.tab-switch {
  display: flex; gap: 4px; background: #f0f0f0;
  border-radius: 10px; padding: 3px;
}
.tab-btn {
  padding: 7px 18px; border: none; border-radius: 8px;
  font-size: .75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; cursor: pointer; transition: all .2s;
  background: transparent; color: #888;
}
.tab-btn.active { background: white; color: #2e7d32; box-shadow: 0 1px 4px rgba(0,0,0,.1); }

/* ── Form card ───────────────────────────────────────────────── */
.form-card {
  background: white; border-radius: 14px; padding: 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
}
.form-card-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f; margin-bottom: 14px;
}
.form-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #558b2f; margin-bottom: 8px;
}

/* ── Lote/animal select ──────────────────────────────────────── */
.select-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px; border: 2px solid #e8e8e8;
  margin-bottom: 6px; cursor: pointer; transition: all .2s;
}
.select-item:hover    { border-color: #81c784; background: #f9fbe7; }
.select-item.selected { border-color: #2e7d32; background: #e8f5e9; }
.select-emoji { font-size: 1.3rem; width: 30px; text-align: center; }
.select-body  { flex: 1; min-width: 0; }
.select-name  { font-weight: 600; font-size: .9rem; }
.select-sub   { font-size: .72rem; color: #888; }
.select-right { flex-shrink: 0; display: flex; align-items: center; }

/* ── Dias sem pesar badge ────────────────────────────────────── */
.dias-badge {
  font-size: .65rem; font-weight: 700; padding: 2px 6px;
  border-radius: 10px; white-space: nowrap;
}
.dias-ok      { background: #e8f5e9; color: #2e7d32; }
.dias-atencao { background: #fff3e0; color: #e65100; }
.dias-critico { background: #fdecea; color: #c62828; }

/* ── Evolução ────────────────────────────────────────────────── */
.evolucao-box {
  background: #f9fbe7; border-radius: 10px; padding: 12px 14px;
  border: 1px solid #c8e6c9; margin-top: 4px;
}
.evolucao-titulo {
  font-size: .65rem; font-weight: 700; color: #558b2f;
  text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px;
}
.evolucao-row {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 0; border-bottom: 1px solid #e8f5e9; font-size: .82rem;
}
.evolucao-row:last-child { border: none; }
.ev-data  { color: #aaa; font-size: .72rem; flex: 1; }
.ev-qtd   { font-size: .72rem; color: #999; }
.ev-peso  { font-weight: 600; color: #1b5e20; }
.ev-gmd   { font-size: .72rem; font-weight: 600; min-width: 60px; text-align: right; }
.gmd-ok   { color: #2e7d32; }
.gmd-neg  { color: #c62828; }

/* ── GMD estimado ────────────────────────────────────────────── */
.gmd-box {
  background: #e8f5e9; border-radius: 10px; padding: 12px 14px;
  border: 1px solid #c8e6c9;
}
.gmd-row {
  display: flex; justify-content: space-between; font-size: .88rem;
  padding: 3px 0; color: #555;
}

/* ── Resumo geral ────────────────────────────────────────────── */
.resumo-card {
  background: white; border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.rg-item  { flex: 1; text-align: center; min-width: 80px; }
.rg-div   { width: 1px; height: 32px; background: #e8e8e8; flex-shrink: 0; }
.rg-val   { font-size: 1.2rem; font-weight: 700; color: #1b5e20; }
.rg-lote  { font-size: .85rem !important; }
.rg-lbl   { font-size: .63rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

/* ── Alertas ─────────────────────────────────────────────────── */
.alertas-wrap { display: flex; flex-direction: column; gap: 6px; }
.alerta-item {
  display: flex; align-items: center; gap: 8px;
  background: #fff8e1; border-radius: 8px; padding: 8px 12px;
  border-left: 3px solid #e65100; font-size: .84rem; color: #5d4037;
}

/* ── Filtro ──────────────────────────────────────────────────── */
.filtro-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.filtro-chip {
  padding: 4px 12px; border-radius: 20px; border: 1px solid #ddd;
  font-size: .75rem; cursor: pointer; transition: all .15s;
  background: white; white-space: nowrap;
}
.filtro-chip:hover { border-color: #81c784; }
.filtro-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

/* ── Histórico ───────────────────────────────────────────────── */
.hist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hist-title  {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f;
}
.hist-list   { display: flex; flex-direction: column; gap: 8px; }

.pesagem-item {
  background: white; border-radius: 12px; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.06); border: 1px solid rgba(0,0,0,.04);
}
.pi-left  { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.pi-emoji { font-size: 1.4rem; flex-shrink: 0; }
.pi-nome  { font-weight: 600; font-size: .92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pi-sub   { font-size: .72rem; color: #aaa; }
.pi-right        { text-align: right; flex-shrink: 0; }
.pi-pesos-row    { display: flex; align-items: center; gap: 8px; justify-content: flex-end; margin-bottom: 2px; }
.pi-peso-bloco   { text-align: center; }
.pi-lote-bloco   { opacity: .75; }
.pi-peso-label   { font-size: .58rem; font-weight: 700; text-transform: uppercase; color: #aaa; letter-spacing: .4px; }
.pi-peso         { font-weight: 700; font-size: 1.05rem; color: #1b5e20; }
.pi-lote-peso    { font-weight: 600; font-size: .95rem; color: #558b2f; }
.pi-sep          { font-size: .7rem; color: #ccc; font-weight: 600; }
.pi-gmd          { font-size: .75rem; font-weight: 600; }
.pi-var          { font-size: .68rem; color: #888; }

.empty-step  { text-align: center; padding: 16px; color: #aaa; font-size: .88rem; }
.empty-state {
  text-align: center; padding: 48px 20px; background: white;
  border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.empty-icon  { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
