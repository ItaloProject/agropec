<template>
  <div>

    <!-- ── Cabeçalho ─────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1>Animais</h1>
        <div class="page-subtitle">{{ totalAtivos }} animais ativos em {{ lotesComAnimais }} lotes</div>
      </div>
      <q-btn color="primary" icon="add" label="Adicionar Animal" unelevated no-caps @click="abrirDialog" />
    </div>

    <!-- ── Resumo rápido ─────────────────────────────────────────── -->
    <div v-if="animais.length" class="resumo-strip q-mb-md">
      <div class="rs-item">
        <div class="rs-val">{{ totalAtivos }}</div>
        <div class="rs-lbl">Ativos</div>
      </div>
      <div class="rs-div" />
      <div class="rs-item">
        <div class="rs-val">{{ totalMachos }}</div>
        <div class="rs-lbl">Machos</div>
      </div>
      <div class="rs-div" />
      <div class="rs-item">
        <div class="rs-val">{{ totalFemeas }}</div>
        <div class="rs-lbl">Fêmeas</div>
      </div>
      <div v-if="pesoMedioEntrada" class="rs-div" />
      <div v-if="pesoMedioEntrada" class="rs-item">
        <div class="rs-val">{{ pesoMedioEntrada.toFixed(0) }} kg</div>
        <div class="rs-lbl">Peso médio entrada</div>
      </div>
      <div v-if="totalVendidos || totalMortos" class="rs-div" />
      <div v-if="totalVendidos" class="rs-item">
        <div class="rs-val text-blue-7">{{ totalVendidos }}</div>
        <div class="rs-lbl">Vendidos</div>
      </div>
      <div v-if="totalMortos" class="rs-div" />
      <div v-if="totalMortos" class="rs-item">
        <div class="rs-val text-negative">{{ totalMortos }}</div>
        <div class="rs-lbl">Mortos</div>
      </div>
    </div>

    <!-- ── Filtros ────────────────────────────────────────────────── -->
    <div class="filtros-row q-mb-md">
      <q-input
        v-model="busca"
        placeholder="Buscar por brinco ou raça..."
        outlined dense clearable
        class="busca-input"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <div class="filtro-chips">
        <div class="filtro-chip" :class="{ active: filtroStatus === null }" @click="filtroStatus = null">Todos</div>
        <div class="filtro-chip" :class="{ active: filtroStatus === 'ativo' }" @click="filtroStatus = 'ativo'">Ativos</div>
        <div class="filtro-chip" :class="{ active: filtroStatus === 'vendido' }" @click="filtroStatus = 'vendido'">Vendidos</div>
        <div class="filtro-chip" :class="{ active: filtroStatus === 'morto' }" @click="filtroStatus = 'morto'">Mortos</div>
        <div class="filtro-chip" :class="{ active: filtroStatus === 'quarentena' }" @click="filtroStatus = 'quarentena'">Quarentena</div>
      </div>

      <div class="filtro-chips">
        <div class="filtro-chip" :class="{ active: filtroLoteId === null }" @click="filtroLoteId = null">Todos os lotes</div>
        <div
          v-for="lote in lotesNoLista" :key="lote.id"
          class="filtro-chip" :class="{ active: filtroLoteId === lote.id }"
          @click="filtroLoteId = lote.id"
        >{{ getEmoji(lote.especie) }} {{ lote.nome }}</div>
      </div>

      <q-btn flat round icon="refresh" size="sm" @click="carregar" :loading="carregando" />
    </div>

    <!-- ── Loading ────────────────────────────────────────────────── -->
    <div v-if="carregando" class="q-py-xl text-center">
      <q-spinner color="primary" size="2em" />
    </div>

    <!-- ── Lista vazia ────────────────────────────────────────────── -->
    <div v-else-if="!animaisFiltrados.length" class="empty-state">
      <div class="empty-icon">🐄</div>
      <div class="empty-msg">
        {{ animais.length ? 'Nenhum animal encontrado com esses filtros' : 'Nenhum animal cadastrado' }}
      </div>
      <q-btn v-if="!animais.length" color="primary" no-caps unelevated label="Adicionar primeiro animal" class="q-mt-md" @click="abrirDialog" />
    </div>

    <!-- ── Tabela de animais ──────────────────────────────────────── -->
    <div v-else class="animal-table">
      <div class="at-head">
        <div class="at-col-id">IDENTIFICAÇÃO</div>
        <div class="at-col-lote">LOTE</div>
        <div class="at-col-info">DETALHES</div>
        <div class="at-col-peso">PESO ENTRADA</div>
        <div class="at-col-status">STATUS</div>
        <div class="at-col-acao"></div>
      </div>

      <div v-for="a in animaisFiltrados" :key="a.id" class="at-row" :class="`status-${a.status}`">
        <!-- Identificação -->
        <div class="at-col-id">
          <div class="at-sexo">{{ a.sexo === 'femea' ? '♀' : a.sexo === 'macho' ? '♂' : '·' }}</div>
          <div>
            <div class="at-brinco">{{ a.brinco ? '#' + a.brinco : '—' }}</div>
            <div class="at-raca">{{ a.raca ?? 'Raça não informada' }}</div>
          </div>
        </div>

        <!-- Lote -->
        <div class="at-col-lote">
          <span class="at-lote-emoji">{{ getEmoji(a.lote?.especie) }}</span>
          <span class="at-lote-nome">{{ a.lote?.nome ?? '—' }}</span>
        </div>

        <!-- Detalhes -->
        <div class="at-col-info">
          <span v-if="a.dataNascimento" class="at-detalhe">{{ formatarData(a.dataNascimento) }}</span>
          <span class="at-origem" :class="a.origem === 'nascido' ? 'orig-nascido' : 'orig-comprado'">
            {{ a.origem === 'nascido' ? 'Nascido' : 'Comprado' }}
          </span>
        </div>

        <!-- Peso -->
        <div class="at-col-peso">
          <span v-if="a.pesoEntrada" class="at-peso">{{ Number(a.pesoEntrada).toFixed(1) }} kg</span>
          <span v-else class="at-sem-dado">—</span>
        </div>

        <!-- Status -->
        <div class="at-col-status">
          <span class="status-badge" :class="`badge-${a.status}`">
            {{ STATUS_LABEL[a.status] ?? a.status }}
          </span>
        </div>

        <!-- Ações -->
        <div class="at-col-acao">
          <q-btn flat round icon="more_vert" size="sm" dense>
            <q-menu anchor="bottom right" self="top right">
              <q-list dense style="min-width:160px">
                <q-item v-if="a.status !== 'ativo'" clickable v-close-popup @click="mudarStatus(a, 'ativo')">
                  <q-item-section avatar><q-icon name="check_circle" color="positive" size="xs" /></q-item-section>
                  <q-item-section>Marcar como ativo</q-item-section>
                </q-item>
                <q-item v-if="a.status !== 'quarentena'" clickable v-close-popup @click="mudarStatus(a, 'quarentena')">
                  <q-item-section avatar><q-icon name="warning" color="warning" size="xs" /></q-item-section>
                  <q-item-section>Quarentena</q-item-section>
                </q-item>
                <q-item v-if="a.status !== 'vendido'" clickable v-close-popup @click="mudarStatus(a, 'vendido')">
                  <q-item-section avatar><q-icon name="sell" color="blue" size="xs" /></q-item-section>
                  <q-item-section>Marcar como vendido</q-item-section>
                </q-item>
                <q-separator />
                <q-item v-if="a.status !== 'morto'" clickable v-close-popup @click="confirmarMorte(a)" class="text-negative">
                  <q-item-section avatar><q-icon name="cancel" color="negative" size="xs" /></q-item-section>
                  <q-item-section>Registrar morte</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- ── Dialog: Adicionar Animal ──────────────────────────────── -->
    <q-dialog v-model="dialogAberto" :maximized="$q.screen.xs">
      <q-card style="width:480px;max-width:100%">
        <q-card-section class="row items-center bg-primary text-white q-py-sm">
          <q-icon name="pets" size="sm" class="q-mr-sm" />
          <div class="text-h6">Adicionar Animal</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md scroll" style="max-height:70vh">
          <q-form @submit="salvar" class="q-gutter-sm">
            <div class="form-label-row">
              <span class="form-label">LOTE *</span>
              <button type="button" class="criar-lote-btn" @click="dialogLote = true">
                + Criar novo lote
              </button>
            </div>
            <div
              v-for="lote in lotesStore.lotesAtivos" :key="lote.id"
              class="select-item" :class="{ selected: form.loteId === lote.id }"
              @click="form.loteId = lote.id"
            >
              <span style="font-size:1.2rem">{{ getEmoji(lote.especie) }}</span>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:.9rem">{{ lote.nome }}</div>
                <div style="font-size:.72rem;color:#888">{{ lote.qtdAtual }} animais</div>
              </div>
              <q-icon v-if="form.loteId === lote.id" name="check_circle" color="primary" />
            </div>
            <div v-if="!lotesStore.lotesAtivos.length" class="sem-lotes">
              Nenhum lote ativo. Crie um lote primeiro.
            </div>

            <div class="row q-gutter-sm q-mt-xs">
              <q-input v-model="form.brinco" label="BRINCO / IDENTIFICAÇÃO" outlined dense class="col" />
              <q-select
                v-model="form.sexo"
                label="SEXO"
                :options="[{ label: 'MACHO', value: 'macho' }, { label: 'FÊMEA', value: 'femea' }]"
                emit-value map-options outlined dense clearable class="col"
              />
            </div>
            <q-select
              v-model="form.raca"
              label="RAÇA"
              :options="racasFiltradas"
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              new-value-mode="add-unique"
              @filter="filtrarRacas"
              @focus="filtrarRacas('', (fn) => fn())"
              outlined dense clearable
            >
              <template #no-option>
                <q-item><q-item-section class="text-grey">Nenhuma raça encontrada — digite para adicionar</q-item-section></q-item>
              </template>
            </q-select>
            <div class="row q-gutter-sm">
              <q-input v-model.number="form.pesoEntrada" type="number" step="0.1" label="PESO ENTRADA (KG)" outlined dense class="col" />
              <q-input v-model="form.dataNascimento" type="month" label="IDADE (mês/ano)" outlined dense class="col" />
            </div>
            <div class="row q-gutter-sm">
              <q-select
                v-model="form.origem"
                label="ORIGEM"
                :options="[{ label: 'COMPRADO', value: 'comprado' }, { label: 'NASCIDO', value: 'nascido' }]"
                emit-value map-options outlined dense class="col"
              />
              <q-input v-model.number="form.valorCompra" type="number" step="0.01" label="VALOR COMPRA (R$)" outlined dense class="col" />
            </div>
            <q-input v-model="form.observacao" label="OBSERVAÇÃO" outlined dense />

            <div class="row q-gutter-sm q-mt-sm">
              <q-btn outline color="primary" no-caps label="Salvar e adicionar outro" class="col" :loading="salvando" @click="salvar(true)" />
              <q-btn type="submit" color="primary" unelevated no-caps label="Salvar" icon="check" class="col" :loading="salvando" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ── Dialog: Criar Lote rápido ─────────────────────────────── -->
    <q-dialog v-model="dialogLote" :maximized="$q.screen.xs">
      <q-card style="width:480px;max-width:100%">
        <q-card-section class="row items-center bg-primary text-white q-py-sm">
          <q-icon name="add_circle" size="sm" class="q-mr-sm" />
          <div class="text-h6">Novo Lote</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md scroll" style="max-height:70vh">
          <q-form @submit="criarLote" class="q-gutter-sm">
            <div class="form-label">ESPÉCIE *</div>
            <div class="especie-grid">
              <button
                v-for="e in ESPECIES" :key="e.valor"
                type="button"
                class="especie-op"
                :class="{ active: novoLote.especie === e.valor }"
                @click="novoLote.especie = e.valor"
              >{{ e.emoji }} {{ e.label }}</button>
            </div>

            <q-input v-model="novoLote.nome" label="NOME DO LOTE *" outlined dense :rules="[v => !!v || 'Obrigatório']" />
            <q-select
              v-model="novoLote.fase"
              :options="FASES" label="FASE" emit-value map-options
              outlined dense
            />
            <div class="row q-gutter-sm">
              <q-select
                v-model="novoLote.finalidade"
                :options="FINALIDADES" label="FINALIDADE" emit-value map-options
                outlined dense class="col"
              />
              <q-input v-model.number="novoLote.qtdInicial" type="number" label="Quantidade *" outlined dense class="col" :rules="[v => v > 0 || 'Obrigatório']" />
            </div>
            <div class="row q-gutter-sm">
              <q-input v-model.number="novoLote.pesoMedioEntrada" type="number" label="Peso (kg)" outlined dense class="col" step="0.1" />
              <q-input v-model="novoLote.dataEntrada" type="date" label="DATA DE ENTRADA *" outlined dense class="col" />
            </div>

            <q-btn type="submit" color="primary" label="CRIAR LOTE" icon="add" unelevated no-caps class="full-width q-mt-sm" :loading="criandoLote" />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useLotesStore } from 'src/stores/lotes.store'
import { useEspecies, ESPECIES } from 'src/composables/useEspecies'

const $q = useQuasar()
const lotesStore = useLotesStore()
const { getEmoji } = useEspecies()

const RACAS_POR_ESPECIE: Record<string, string[]> = {
  bovino:      ['Nelore', 'Angus', 'Hereford', 'Simental', 'Gir', 'Girolando', 'Brahman', 'Charolês', 'Limousin', 'Senepol', 'Tabapuã', 'Canchim', 'Guzerá', 'Bonsmara'],
  suino:       ['Landrace', 'Large White', 'Duroc', 'Pietrain', 'Hampshire', 'Agroceres', 'MS60', 'Camborough'],
  ovino:       ['Dorper', 'Santa Inês', 'Morada Nova', 'Suffolk', 'Texel', 'Ile de France', 'Bergamácia'],
  caprino:     ['Boer', 'Anglo-Nubiana', 'Saanen', 'Toggenburg', 'Alpina', 'Moxotó', 'Canindé'],
  equino:      ['Quarto de Milha', 'Mangalarga', 'Árabe', 'Paint Horse', 'Appaloosa', 'Crioulo', 'Lusitano', 'Warmblood'],
  avicultura:  ['Cobb 500', 'Ross 308', 'Hubbard', 'ISA Brown', 'Lohmann Brown', 'Caipira', 'Label Rouge'],
  piscicultura:['Tilápia Chitralada', 'Tilápia GIFT', 'Tambaqui', 'Pintado', 'Pirarucu', 'Traíra', 'Carpa Comum'],
}

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  vendido: 'Vendido',
  morto: 'Morto',
  quarentena: 'Quarentena',
}

const animais      = ref<any[]>([])
const carregando   = ref(false)
const salvando     = ref(false)
const dialogAberto = ref(false)
const dialogLote   = ref(false)
const criandoLote  = ref(false)

const FASES = [
  { label: 'Cria', value: 'cria' }, { label: 'Recria', value: 'recria' },
  { label: 'Engorda', value: 'engorda' }, { label: 'Terminação', value: 'terminacao' },
  { label: 'Maternidade', value: 'maternidade' }, { label: 'Creche', value: 'creche' },
  { label: 'Produção', value: 'producao' },
]

const FINALIDADES = [
  { label: 'Corte', value: 'corte' }, { label: 'Leite', value: 'leite' },
  { label: 'Reprodução', value: 'reproducao' }, { label: 'Postura', value: 'postura' },
  { label: 'Esporte', value: 'esporte' }, { label: 'Trabalho', value: 'trabalho' },
  { label: 'Piscicultura', value: 'piscicultura' },
]

const novoLote = ref({
  nome: '', especie: 'bovino', finalidade: 'corte', fase: 'engorda',
  qtdInicial: null as number | null,
  pesoMedioEntrada: null as number | null,
  dataEntrada: new Date().toISOString().split('T')[0],
})
const busca        = ref('')
const filtroStatus = ref<string | null>('ativo')
const filtroLoteId = ref<number | null>(null)

const form = ref({
  loteId: null as number | null,
  brinco: '', raca: '',
  sexo: null as 'macho' | 'femea' | null,
  dataNascimento: '',
  origem: 'comprado' as 'comprado' | 'nascido',
  pesoEntrada: null as number | null,
  valorCompra: null as number | null,
  observacao: '',
})

// ── Computed ──────────────────────────────────────────────────────

const racasSugeridas = computed(() => {
  const lote = lotesStore.lotesAtivos.find(l => l.id === form.value.loteId)
  const especie = lote?.especie ?? 'bovino'
  return RACAS_POR_ESPECIE[especie] ?? []
})

const racasFiltradas = ref<string[]>([])

function filtrarRacas(val: string, update: (fn: () => void) => void) {
  update(() => {
    const q = val.toLowerCase()
    racasFiltradas.value = q
      ? racasSugeridas.value.filter(r => r.toLowerCase().includes(q))
      : [...racasSugeridas.value]
  })
}

const lotesNoLista = computed(() => {
  const map = new Map<number, any>()
  animais.value.forEach(a => { if (a.lote) map.set(a.lote.id, a.lote) })
  return [...map.values()]
})

const lotesComAnimais = computed(() => lotesNoLista.value.length)

const animaisFiltrados = computed(() => {
  let lista = animais.value
  if (filtroStatus.value) lista = lista.filter(a => a.status === filtroStatus.value)
  if (filtroLoteId.value !== null) lista = lista.filter(a => a.loteId === filtroLoteId.value)
  if (busca.value.trim()) {
    const q = busca.value.trim().toLowerCase()
    lista = lista.filter(a =>
      (a.brinco ?? '').toLowerCase().includes(q) ||
      (a.raca   ?? '').toLowerCase().includes(q)
    )
  }
  return lista
})

const totalAtivos   = computed(() => animais.value.filter(a => a.status === 'ativo').length)
const totalMachos   = computed(() => animais.value.filter(a => a.status === 'ativo' && a.sexo === 'macho').length)
const totalFemeas   = computed(() => animais.value.filter(a => a.status === 'ativo' && a.sexo === 'femea').length)
const totalVendidos = computed(() => animais.value.filter(a => a.status === 'vendido').length)
const totalMortos   = computed(() => animais.value.filter(a => a.status === 'morto').length)

const pesoMedioEntrada = computed(() => {
  const com = animais.value.filter(a => a.status === 'ativo' && a.pesoEntrada)
  if (!com.length) return null
  return com.reduce((s, a) => s + Number(a.pesoEntrada), 0) / com.length
})

// ── Funções ───────────────────────────────────────────────────────

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

function abrirDialog() {
  form.value = {
    loteId: null, brinco: '', raca: '', sexo: null,
    dataNascimento: '', origem: 'comprado',
    pesoEntrada: null, valorCompra: null, observacao: '',
  }
  dialogAberto.value = true
}

async function carregar() {
  carregando.value = true
  try {
    animais.value = await api.get('/animais?status=todos').then(r => r.data)
  } finally {
    carregando.value = false
  }
}

async function salvar(manterAberto = false) {
  if (!form.value.loteId) {
    $q.notify({ type: 'warning', message: 'Selecione um lote' })
    return
  }
  salvando.value = true
  try {
    const payload: any = { loteId: form.value.loteId }
    if (form.value.brinco)         payload.brinco         = form.value.brinco
    if (form.value.raca)           payload.raca           = form.value.raca
    if (form.value.sexo)           payload.sexo           = form.value.sexo
    if (form.value.dataNascimento) payload.dataNascimento = form.value.dataNascimento + '-01'
    if (form.value.origem)         payload.origem         = form.value.origem
    if (form.value.pesoEntrada)    payload.pesoEntrada    = form.value.pesoEntrada
    if (form.value.valorCompra)    payload.valorCompra    = form.value.valorCompra
    if (form.value.observacao)     payload.observacao     = form.value.observacao

    await api.post('/animais', payload)
    $q.notify({ type: 'positive', message: 'Animal cadastrado!' })
    await Promise.all([carregar(), lotesStore.carregar()])

    if (manterAberto) {
      form.value = {
        loteId: form.value.loteId, brinco: '', raca: '', sexo: null,
        dataNascimento: '', origem: 'comprado',
        pesoEntrada: null, valorCompra: null, observacao: '',
      }
    } else {
      dialogAberto.value = false
    }
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao cadastrar' })
  } finally {
    salvando.value = false
  }
}

async function mudarStatus(animal: any, novoStatus: string) {
  try {
    await api.patch(`/animais/${animal.id}/status`, { status: novoStatus })
    animal.status = novoStatus
    $q.notify({ type: 'positive', message: `Animal marcado como ${STATUS_LABEL[novoStatus]}` })
    await lotesStore.carregar()
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao atualizar status' })
  }
}

function confirmarMorte(animal: any) {
  $q.dialog({
    title: 'Registrar morte',
    message: `Confirmar morte do animal ${animal.brinco ? '#' + animal.brinco : 'sem brinco'}?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Confirmar', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(() => mudarStatus(animal, 'morto'))
}

async function criarLote() {
  if (!novoLote.value.nome || !novoLote.value.especie) return
  criandoLote.value = true
  try {
    const { data } = await api.post('/lotes', novoLote.value)
    await lotesStore.carregar()
    form.value.loteId = data.id
    dialogLote.value = false
    novoLote.value = { nome: '', especie: 'bovino', fase: 'engorda', finalidade: 'corte', qtdInicial: 1, pesoMedioEntrada: null, dataEntrada: new Date().toISOString().slice(0, 10) }
    $q.notify({ type: 'positive', message: 'Lote criado com sucesso!' })
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao criar lote.' })
  } finally {
    criandoLote.value = false
  }
}

onMounted(async () => {
  await Promise.all([lotesStore.carregar(), carregar()])
})
</script>

<style scoped>
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }

/* ── Resumo strip ────────────────────────────────────────────────── */
.resumo-strip {
  background: white; border-radius: 14px; padding: 14px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.rs-item  { flex: 1; text-align: center; min-width: 70px; }
.rs-div   { width: 1px; height: 32px; background: #e8e8e8; flex-shrink: 0; }
.rs-val   { font-size: 1.2rem; font-weight: 700; color: #1b5e20; }
.rs-lbl   { font-size: .63rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

/* ── Filtros ─────────────────────────────────────────────────────── */
.filtros-row {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
}
.busca-input { min-width: 220px; flex: 0 0 220px; }
.filtro-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.filtro-chip {
  padding: 4px 12px; border-radius: 20px; border: 1px solid #ddd;
  font-size: .75rem; cursor: pointer; transition: all .15s;
  background: white; white-space: nowrap; user-select: none;
}
.filtro-chip:hover  { border-color: #81c784; }
.filtro-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

/* ── Tabela ──────────────────────────────────────────────────────── */
.animal-table {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
}

.at-head {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 40px;
  padding: 10px 16px;
  background: #f9fbe7; border-bottom: 1px solid #e8f5e9;
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #558b2f;
}

.at-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 40px;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  align-items: center;
  transition: background .15s;
}
.at-row:last-child { border-bottom: none; }
.at-row:hover { background: #fafff9; }
.at-row.status-vendido  { opacity: .7; }
.at-row.status-morto    { opacity: .5; }
.at-row.status-quarentena { background: #fffde7; }

@media (max-width: 767px) {
  .at-head { display: none; }
  .at-row  {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 4px;
  }
  .at-col-lote, .at-col-info { display: none; }
  .at-col-peso  { text-align: right; }
  .at-col-status { grid-column: 1; }
  .at-col-acao  { grid-column: 2; grid-row: 1 / 3; align-self: center; }
}

.at-col-id     { display: flex; align-items: center; gap: 10px; }
.at-col-lote   { display: flex; align-items: center; gap: 6px; }
.at-col-info   { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.at-col-peso   { }
.at-col-status { }
.at-col-acao   { display: flex; justify-content: center; }

.at-sexo  { font-size: 1.2rem; color: #558b2f; width: 20px; text-align: center; flex-shrink: 0; }
.at-brinco { font-weight: 700; font-size: .92rem; color: #1b5e20; }
.at-raca   { font-size: .72rem; color: #aaa; }

.at-lote-emoji { font-size: 1rem; }
.at-lote-nome  { font-size: .85rem; font-weight: 500; color: #333; }

.at-detalhe { font-size: .78rem; color: #888; }
.at-origem  {
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  padding: 2px 7px; border-radius: 8px;
}
.orig-comprado { background: #e3f2fd; color: #1565c0; }
.orig-nascido  { background: #f3e5f5; color: #6a1b9a; }

.at-peso    { font-weight: 700; font-size: .95rem; color: #2e7d32; }
.at-sem-dado { color: #ccc; }

/* ── Status badge ────────────────────────────────────────────────── */
.status-badge {
  display: inline-block; font-size: .68rem; font-weight: 700;
  text-transform: uppercase; padding: 3px 9px; border-radius: 10px;
  letter-spacing: .3px;
}
.badge-ativo      { background: #e8f5e9; color: #2e7d32; }
.badge-vendido    { background: #e3f2fd; color: #1565c0; }
.badge-morto      { background: #fdecea; color: #b71c1c; }
.badge-quarentena { background: #fff8e1; color: #e65100; }

/* ── Dialog select item ──────────────────────────────────────────── */
.select-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px; border: 2px solid #e8e8e8;
  margin-bottom: 6px; cursor: pointer; transition: all .2s;
}
.select-item:hover    { border-color: #81c784; background: #f9fbe7; }
.select-item.selected { border-color: #2e7d32; background: #e8f5e9; }

.form-label {
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #558b2f; margin-bottom: 6px;
}

/* ── Dialog: criar lote ──────────────────────────────────────────── */
.form-label-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
}
.criar-lote-btn {
  background: none; border: none; color: #2e7d32; font-size: .78rem;
  font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0;
}
.sem-lotes {
  text-align: center; padding: 12px; color: #aaa; font-size: .85rem;
}
.especie-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
  margin-bottom: 4px;
}
.especie-op {
  padding: 8px 6px; border-radius: 8px; border: 1.5px solid #e5e7eb;
  background: #f9fafb; font-size: .78rem; font-weight: 600; cursor: pointer;
  transition: all .15s; text-align: center;
}
.especie-op.active { border-color: #2e7d32; background: #dcfce7; color: #166534; }

/* ── Empty ───────────────────────────────────────────────────────── */
.empty-state {
  text-align: center; padding: 60px 20px; background: white;
  border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06);
}
.empty-icon { font-size: 3rem; margin-bottom: 8px; }
.empty-msg  { color: #aaa; font-size: .9rem; }
</style>
