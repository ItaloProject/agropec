<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Animais</h1>
        <div class="page-subtitle">Rastreabilidade individual por lote</div>
      </div>
    </div>

    <div class="animais-layout">
      <!-- ── Formulário ──────────────────────────────────────────── -->
      <div class="form-col">
        <div class="form-card">
          <div class="form-card-title">CADASTRAR ANIMAL</div>

          <q-form @submit="salvar" class="q-gutter-sm">
            <div class="form-label">LOTE</div>
            <div
              v-for="lote in lotesStore.lotesAtivos" :key="lote.id"
              class="select-item" :class="{ selected: form.loteId === lote.id }"
              @click="form.loteId = lote.id"
            >
              <span class="select-emoji">{{ getEmoji(lote.especie) }}</span>
              <div class="select-body">
                <div class="select-name">{{ lote.nome }}</div>
                <div class="select-sub">{{ lote.qtdAtual }} animais</div>
              </div>
              <div class="select-right">
                <q-icon v-if="form.loteId === lote.id" name="check_circle" color="primary" />
              </div>
            </div>

            <div v-if="!lotesStore.lotesAtivos.length" class="empty-step">
              Nenhum lote ativo.
            </div>

            <div class="row q-gutter-sm">
              <q-input v-model="form.brinco" label="BRINCO / IDENTIFICAÇÃO" outlined dense class="col" />
              <q-select
                v-model="form.sexo"
                label="SEXO"
                :options="[{ label: 'MACHO', value: 'macho' }, { label: 'FÊMEA', value: 'femea' }]"
                emit-value map-options
                outlined dense clearable class="col"
              />
            </div>

            <q-input v-model="form.raca" label="RAÇA" outlined dense />

            <div class="row q-gutter-sm">
              <q-input
                v-model.number="form.pesoEntrada"
                type="number" label="PESO ENTRADA (KG)"
                outlined dense class="col" step="0.1"
              />
              <q-input v-model="form.dataNascimento" type="date" label="NASCIMENTO" outlined dense class="col" />
            </div>

            <div class="row q-gutter-sm">
              <q-select
                v-model="form.origem"
                label="ORIGEM"
                :options="[{ label: 'COMPRADO', value: 'comprado' }, { label: 'NASCIDO', value: 'nascido' }]"
                emit-value map-options
                outlined dense class="col"
              />
              <q-input
                v-model.number="form.valorCompra"
                type="number" label="VALOR COMPRA (R$)"
                outlined dense class="col" step="0.01"
              />
            </div>

            <q-input v-model="form.observacao" label="OBSERVAÇÃO" outlined dense />

            <q-btn
              type="submit" color="primary" label="CADASTRAR ANIMAL"
              icon="pets" unelevated no-caps class="full-width q-mt-sm"
              :loading="salvando" :disable="!form.loteId"
            />
          </q-form>
        </div>
      </div>

      <!-- ── Lista ──────────────────────────────────────────────── -->
      <div class="hist-col">

        <!-- Resumo por espécie -->
        <div v-if="totalAnimais > 0" class="resumo-card q-mb-md">
          <div class="rg-item">
            <div class="rg-val">{{ totalAnimais }}</div>
            <div class="rg-lbl">Animais ativos</div>
          </div>
          <div class="rg-div" />
          <div class="rg-item">
            <div class="rg-val">{{ totalMachos }}</div>
            <div class="rg-lbl">Machos</div>
          </div>
          <div class="rg-div" />
          <div class="rg-item">
            <div class="rg-val">{{ totalFemeas }}</div>
            <div class="rg-lbl">Fêmeas</div>
          </div>
          <div v-if="pesoMedioEntrada" class="rg-div" />
          <div v-if="pesoMedioEntrada" class="rg-item">
            <div class="rg-val">{{ pesoMedioEntrada.toFixed(0) }} kg</div>
            <div class="rg-lbl">Peso médio entrada</div>
          </div>
        </div>

        <div class="hist-header">
          <div class="hist-title">ANIMAIS CADASTRADOS</div>
          <q-btn flat round icon="refresh" size="sm" @click="carregar" :loading="carregando" />
        </div>

        <!-- Filtro por lote -->
        <div class="filtro-chips q-mb-md">
          <div class="filtro-chip" :class="{ active: filtroLoteId === null }" @click="filtroLoteId = null">Todos</div>
          <div
            v-for="lote in lotesNoLista" :key="lote.id"
            class="filtro-chip" :class="{ active: filtroLoteId === lote.id }"
            @click="filtroLoteId = lote.id"
          >{{ getEmoji(lote.especie) }} {{ lote.nome }}</div>
        </div>

        <div v-if="carregando" class="q-py-xl text-center">
          <q-spinner color="primary" />
        </div>

        <div v-else-if="!animaisFiltrados.length" class="empty-state">
          <div class="empty-icon">🐄</div>
          <div class="empty-msg">Nenhum animal cadastrado</div>
        </div>

        <div v-else class="animal-list">
          <div v-for="a in animaisFiltrados" :key="a.id" class="animal-item">
            <div class="ai-sexo">{{ a.sexo === 'femea' ? '♀' : a.sexo === 'macho' ? '♂' : '·' }}</div>
            <div class="ai-body">
              <div class="ai-nome">{{ a.brinco ? 'BRINCO #' + a.brinco : 'SEM BRINCO' }}</div>
              <div class="ai-sub">
                {{ getEmoji(a.lote?.especie) }} {{ a.lote?.nome }}
                <span v-if="a.raca"> · {{ a.raca }}</span>
                <span v-if="a.dataNascimento"> · {{ formatarData(a.dataNascimento) }}</span>
              </div>
            </div>
            <div class="ai-right">
              <div v-if="a.pesoEntrada" class="ai-peso">{{ a.pesoEntrada.toFixed(1) }} kg</div>
              <div class="ai-origem" :class="a.origem === 'nascido' ? 'orig-nascido' : 'orig-comprado'">
                {{ a.origem === 'nascido' ? 'NASCIDO' : 'COMPRADO' }}
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

const animais = ref<any[]>([])
const carregando = ref(false)
const salvando = ref(false)
const filtroLoteId = ref<number | null>(null)

const form = ref({
  loteId: null as number | null,
  brinco: '',
  raca: '',
  sexo: null as 'macho' | 'femea' | null,
  dataNascimento: '',
  origem: 'comprado' as 'comprado' | 'nascido',
  pesoEntrada: null as number | null,
  valorCompra: null as number | null,
  observacao: '',
})

// ── Computed ─────────────────────────────────────────────────────

const lotesNoLista = computed(() => {
  const map = new Map<number, any>()
  animais.value.forEach(a => {
    if (a.lote && !map.has(a.lote.id)) map.set(a.lote.id, a.lote)
  })
  return [...map.values()]
})

const animaisFiltrados = computed(() =>
  filtroLoteId.value !== null
    ? animais.value.filter(a => a.loteId === filtroLoteId.value)
    : animais.value
)

const totalAnimais = computed(() => animais.value.length)
const totalMachos  = computed(() => animais.value.filter(a => a.sexo === 'macho').length)
const totalFemeas  = computed(() => animais.value.filter(a => a.sexo === 'femea').length)

const pesoMedioEntrada = computed(() => {
  const comPeso = animais.value.filter(a => a.pesoEntrada)
  if (!comPeso.length) return null
  return comPeso.reduce((s, a) => s + a.pesoEntrada, 0) / comPeso.length
})

// ── Funções ──────────────────────────────────────────────────────

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

async function carregar() {
  carregando.value = true
  try {
    animais.value = await api.get('/animais').then(r => r.data)
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  if (!form.value.loteId) return
  salvando.value = true
  try {
    const payload: any = { loteId: form.value.loteId }
    if (form.value.brinco)        payload.brinco        = form.value.brinco
    if (form.value.raca)          payload.raca          = form.value.raca
    if (form.value.sexo)          payload.sexo          = form.value.sexo
    if (form.value.dataNascimento) payload.dataNascimento = form.value.dataNascimento
    if (form.value.origem)        payload.origem        = form.value.origem
    if (form.value.pesoEntrada)   payload.pesoEntrada   = form.value.pesoEntrada
    if (form.value.valorCompra)   payload.valorCompra   = form.value.valorCompra
    if (form.value.observacao)    payload.observacao    = form.value.observacao

    await api.post('/animais', payload)
    $q.notify({ type: 'positive', message: 'Animal cadastrado!' })

    const loteId = form.value.loteId
    form.value = {
      loteId, brinco: '', raca: '', sexo: null,
      dataNascimento: '', origem: 'comprado',
      pesoEntrada: null, valorCompra: null, observacao: '',
    }
    await carregar()
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao cadastrar animal' })
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  await Promise.all([lotesStore.carregar(), carregar()])
})
</script>

<style scoped>
.animais-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 899px) {
  .animais-layout { grid-template-columns: 1fr; }
}

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

.resumo-card {
  background: white; border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.rg-item  { flex: 1; text-align: center; min-width: 70px; }
.rg-div   { width: 1px; height: 32px; background: #e8e8e8; flex-shrink: 0; }
.rg-val   { font-size: 1.2rem; font-weight: 700; color: #1b5e20; }
.rg-lbl   { font-size: .63rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

.hist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hist-title  {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f;
}

.filtro-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.filtro-chip {
  padding: 4px 12px; border-radius: 20px; border: 1px solid #ddd;
  font-size: .75rem; cursor: pointer; transition: all .15s;
  background: white; white-space: nowrap;
}
.filtro-chip:hover  { border-color: #81c784; }
.filtro-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

.animal-list { display: flex; flex-direction: column; gap: 8px; }
.animal-item {
  background: white; border-radius: 12px; padding: 12px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.06); border: 1px solid rgba(0,0,0,.04);
}
.ai-sexo {
  font-size: 1.4rem; width: 28px; text-align: center;
  flex-shrink: 0; color: #558b2f;
}
.ai-body { flex: 1; min-width: 0; }
.ai-nome { font-weight: 600; font-size: .92rem; }
.ai-sub  { font-size: .72rem; color: #aaa; }
.ai-right { text-align: right; flex-shrink: 0; }
.ai-peso  { font-weight: 700; font-size: 1rem; color: #1b5e20; }
.ai-origem {
  font-size: .62rem; font-weight: 700; text-transform: uppercase;
  padding: 2px 6px; border-radius: 8px; margin-top: 3px;
}
.orig-comprado { background: #e3f2fd; color: #1565c0; }
.orig-nascido  { background: #f3e5f5; color: #6a1b9a; }

.empty-step { text-align: center; padding: 16px; color: #aaa; font-size: .88rem; }
.empty-state {
  text-align: center; padding: 48px 20px; background: white;
  border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg  { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
