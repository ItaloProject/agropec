<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Compras</h1>
        <div class="page-subtitle">Registro de compras de insumos</div>
      </div>
    </div>

    <div class="compras-layout">
      <!-- Formulário -->
      <div class="compras-form-col">
        <div class="form-card">
          <div class="form-card-title">Nova compra</div>

          <!-- Filtro de espécie -->
          <div v-if="especiesDoUsuario.length" class="especie-filtro q-mb-md">
            <div class="filtro-label">Compra para qual criação?</div>
            <div class="especie-chips">
              <button
                v-for="e in especiesDoUsuario" :key="e.valor"
                type="button"
                class="especie-chip"
                :class="{ active: especieSelecionada === e.valor }"
                @click="especieSelecionada = especieSelecionada === e.valor ? null : e.valor"
              >{{ e.emoji }} {{ e.label }}</button>
            </div>
          </div>

          <!-- Sugestões rápidas -->
          <div v-if="sugestoesRapidas.length" class="sugestoes-box q-mb-sm">
            <div class="sugestoes-label">Sugestões para {{ emojiEspecie }} {{ labelEspecie }}</div>
            <div class="sugestoes-chips">
              <button
                v-for="s in sugestoesRapidas" :key="s.nome"
                type="button"
                class="sug-chip"
                @click="selecionarSugestao(s)"
              >{{ s.nome }}</button>
            </div>
          </div>

          <q-form @submit="registrarCompra" class="q-gutter-sm">
            <!-- Insumo com busca livre -->
            <q-select
              v-model="insumoSelecionado"
              :options="opcoesInsumosVisiveis"
              label="Insumo *"
              outlined dense
              use-input
              fill-input
              hide-selected
              input-debounce="150"
              @filter="filtrarInsumos"
              :rules="[v => !!v || 'Selecione ou escreva o insumo']"
            >
              <template #option="{ opt, itemProps }">
                <q-item v-bind="itemProps">
                  <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="opt.novo">
                    <q-chip dense color="blue-1" text-color="blue-8" size="xs">criar</q-chip>
                  </q-item-section>
                  <q-item-section side v-else>
                    <div class="insumo-qtd">{{ opt.qtd }}</div>
                  </q-item-section>
                </q-item>
              </template>
              <template #no-option="{ inputValue }">
                <q-item v-if="inputValue" clickable @click="selecionarNovo(inputValue)">
                  <q-item-section>
                    <q-item-label class="text-primary">+ Criar insumo "{{ inputValue }}"</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-else><q-item-section class="text-grey text-caption">Digite o nome do insumo</q-item-section></q-item>
              </template>
            </q-select>

            <div class="row q-gutter-sm">
              <q-input
                v-model.number="form.quantidade"
                type="number" label="KG *"
                outlined dense class="col"
                :rules="[v => v > 0 || 'Obrigatório']"
                step="0.01"
              />
              <q-input
                v-model.number="form.valorUnitario"
                type="number" label="Valor (R$) *"
                outlined dense class="col"
                :rules="[v => v >= 0 || 'Obrigatório']"
                step="0.01"
              />
            </div>

            <div v-if="totalCompra" class="total-box">
              Total: <strong>R$ {{ totalCompra.toFixed(2) }}</strong>
            </div>

            <q-input v-model="form.data" type="date" label="Data da compra *" outlined dense />

            <q-input v-model="form.observacao" label="Observação" outlined dense />

            <q-btn
              type="submit"
              color="primary"
              label="Registrar compra"
              icon="shopping_cart"
              unelevated no-caps class="full-width q-mt-sm"
              :loading="salvando"
            />
          </q-form>
        </div>
      </div>

      <!-- Histórico -->
      <div class="compras-hist-col">
        <div class="hist-header">
          <div class="hist-title">Histórico de compras</div>
          <q-btn flat round icon="refresh" size="sm" @click="carregar" :loading="carregando" />
        </div>

        <div v-if="carregando" class="q-py-xl text-center">
          <q-spinner color="primary" />
        </div>

        <div v-else-if="!compras.length" class="empty-state">
          <div class="empty-icon">🛒</div>
          <div class="empty-msg">Nenhuma compra registrada</div>
        </div>

        <div v-else class="hist-list">
          <div v-for="c in compras" :key="c.id" class="hist-item">
            <div class="hist-left">
              <div class="hist-nome">{{ c.insumo?.nome }}</div>
              <div class="hist-sub">
                {{ c.quantidade.toFixed(1) }} {{ c.insumo?.unidade }}
                <span v-if="c.fornecedor"> · {{ c.fornecedor.nome }}</span>
                <span v-if="c.notaFiscal" class="text-grey-6"> · NF {{ c.notaFiscal }}</span>
              </div>
            </div>
            <div class="hist-right">
              <div class="hist-total">R$ {{ (c.valorTotal ?? c.quantidade * c.valorUnitario).toFixed(2) }}</div>
              <div class="hist-data">{{ formatarData(c.data) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useEstoqueStore } from 'src/stores/estoque.store'
import { useLotesStore } from 'src/stores/lotes.store'
import { useEspecies } from 'src/composables/useEspecies'

const $q = useQuasar()
const estoqueStore = useEstoqueStore()
const lotesStore   = useLotesStore()
const { getEmoji, getLabel } = useEspecies()

// ── Sugestões por espécie ─────────────────────────────────────────
const SUGESTOES: Record<string, { nome: string; tipo: string; unidade: string }[]> = {
  bovino: [
    { nome: 'Sal mineral bovino', tipo: 'suplemento', unidade: 'kg' },
    { nome: 'Ração para bovinos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Silagem de milho', tipo: 'volumoso', unidade: 'kg' },
    { nome: 'Feno de coast-cross', tipo: 'volumoso', unidade: 'kg' },
    { nome: 'Farelo de soja', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Milho grão', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Uréia pecuária', tipo: 'suplemento', unidade: 'kg' },
    { nome: 'Calcário calcítico', tipo: 'suplemento', unidade: 'kg' },
  ],
  suino: [
    { nome: 'Ração inicial suínos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Ração crescimento suínos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Ração terminação suínos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Premix suíno', tipo: 'suplemento', unidade: 'kg' },
    { nome: 'Farelo de soja', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Milho grão', tipo: 'concentrado', unidade: 'kg' },
  ],
  avicultura: [
    { nome: 'Ração inicial frangos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Ração crescimento frangos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Ração postura', tipo: 'racao', unidade: 'kg' },
    { nome: 'Farelo de soja', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Milho grão', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Calcário calcítico', tipo: 'suplemento', unidade: 'kg' },
  ],
  ovino: [
    { nome: 'Ração para ovinos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Sal mineral ovino', tipo: 'suplemento', unidade: 'kg' },
    { nome: 'Feno de tifton', tipo: 'volumoso', unidade: 'kg' },
    { nome: 'Milho grão', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Farelo de soja', tipo: 'concentrado', unidade: 'kg' },
  ],
  caprino: [
    { nome: 'Ração para caprinos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Sal mineral caprino', tipo: 'suplemento', unidade: 'kg' },
    { nome: 'Feno de tifton', tipo: 'volumoso', unidade: 'kg' },
    { nome: 'Milho grão', tipo: 'concentrado', unidade: 'kg' },
  ],
  equino: [
    { nome: 'Ração para equinos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Feno de coast-cross', tipo: 'volumoso', unidade: 'kg' },
    { nome: 'Aveia', tipo: 'concentrado', unidade: 'kg' },
    { nome: 'Sal mineral equino', tipo: 'suplemento', unidade: 'kg' },
    { nome: 'Farelo de milho', tipo: 'concentrado', unidade: 'kg' },
  ],
  piscicultura: [
    { nome: 'Ração extrusada peixes', tipo: 'racao', unidade: 'kg' },
    { nome: 'Ração alevinos', tipo: 'racao', unidade: 'kg' },
    { nome: 'Calcário para lago', tipo: 'suplemento', unidade: 'kg' },
  ],
}

// ── Estado ────────────────────────────────────────────────────────
const compras           = ref<any[]>([])
const carregando        = ref(false)
const salvando          = ref(false)
const especieSelecionada = ref<string | null>(null)
const insumoSelecionado  = ref<any>(null)
const opcoesInsumosVisiveis = ref<any[]>([])

const form = ref({
  data:          new Date().toISOString().split('T')[0],
  quantidade:    null as number | null,
  valorUnitario: null as number | null,
  observacao:    '',
})

// ── Espécies do usuário ───────────────────────────────────────────
const especiesDoUsuario = computed(() => {
  const unicas = [...new Set(lotesStore.lotesAtivos.map(l => l.especie))]
  return unicas.map(e => ({ valor: e, emoji: getEmoji(e), label: getLabel(e) }))
})

const emojiEspecie = computed(() => especieSelecionada.value ? getEmoji(especieSelecionada.value) : '')
const labelEspecie = computed(() => especieSelecionada.value ? getLabel(especieSelecionada.value) : '')

// ── Sugestões rápidas ─────────────────────────────────────────────
const nomesNoEstoque = computed(() =>
  new Set(estoqueStore.items.map((i: any) => i.insumo.nome.toLowerCase()))
)

const sugestoesRapidas = computed(() => {
  if (!especieSelecionada.value) return []
  return (SUGESTOES[especieSelecionada.value] ?? [])
    .filter(s => !nomesNoEstoque.value.has(s.nome.toLowerCase()))
    .slice(0, 6)
})

// ── Opções de insumo: estoque + sugestões ─────────────────────────
const todasOpcoes = computed(() => {
  const existentes = estoqueStore.items.map((i: any) => ({
    label: i.insumo.nome,
    value: i.insumo.id,
    qtd: `${i.qtdAtual.toFixed(1)} ${i.insumo.unidade}`,
    novo: false,
    meta: null,
  }))

  const sugeridas = especieSelecionada.value
    ? (SUGESTOES[especieSelecionada.value] ?? [])
        .filter(s => !nomesNoEstoque.value.has(s.nome.toLowerCase()))
        .map(s => ({ label: s.nome, value: null, qtd: '', novo: true, meta: s }))
    : []

  return [...existentes, ...sugeridas]
})

function filtrarInsumos(val: string, update: (fn: () => void) => void) {
  update(() => {
    if (!val) {
      opcoesInsumosVisiveis.value = todasOpcoes.value
      return
    }
    const q = val.toLowerCase()
    opcoesInsumosVisiveis.value = todasOpcoes.value.filter(o =>
      o.label.toLowerCase().includes(q)
    )
  })
}

function selecionarSugestao(s: { nome: string; tipo: string; unidade: string }) {
  const existente = estoqueStore.items.find((i: any) =>
    i.insumo.nome.toLowerCase() === s.nome.toLowerCase()
  )
  if (existente) {
    insumoSelecionado.value = {
      label: existente.insumo.nome, value: existente.insumo.id,
      qtd: `${existente.qtdAtual.toFixed(1)} ${existente.insumo.unidade}`,
      novo: false, meta: null,
    }
  } else {
    insumoSelecionado.value = { label: s.nome, value: null, novo: true, meta: s }
  }
}

function selecionarNovo(nome: string) {
  insumoSelecionado.value = {
    label: nome, value: null, novo: true,
    meta: { nome, tipo: 'outro', unidade: 'kg' },
  }
}

// ── Computed helpers ──────────────────────────────────────────────
const totalCompra = computed(() => {
  if (!form.value.quantidade || !form.value.valorUnitario) return null
  return form.value.quantidade * form.value.valorUnitario
})

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

// ── API ───────────────────────────────────────────────────────────
async function carregar() {
  carregando.value = true
  try {
    compras.value = await api.get('/compras?limite=50').then(r => r.data)
  } finally {
    carregando.value = false
  }
}

async function registrarCompra() {
  if (!insumoSelecionado.value || !form.value.quantidade || form.value.valorUnitario == null) return
  salvando.value = true
  try {
    let insumoId = insumoSelecionado.value.value as number | null

    if (!insumoId && insumoSelecionado.value.novo) {
      const meta = insumoSelecionado.value.meta
      const { data } = await api.post('/estoque/insumos', {
        nome: meta.nome,
        tipo: meta.tipo ?? 'outro',
        unidade: meta.unidade ?? 'kg',
      })
      insumoId = data.insumo.id
      await estoqueStore.carregar()
    }

    await api.post('/compras', { ...form.value, insumoId })
    $q.notify({ type: 'positive', message: 'Compra registrada! Estoque atualizado.' })

    insumoSelecionado.value = null
    form.value = {
      data: new Date().toISOString().split('T')[0],
      quantidade: null, valorUnitario: null,
      observacao: '',
    }
    await Promise.all([carregar(), estoqueStore.carregar()])
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar compra' })
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  await Promise.all([estoqueStore.carregar(), lotesStore.carregar(), carregar()])
  opcoesInsumosVisiveis.value = todasOpcoes.value

  if (especiesDoUsuario.value.length === 1) {
    especieSelecionada.value = especiesDoUsuario.value[0]!.valor
  }
})
</script>

<style scoped>
.compras-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 899px) {
  .compras-layout { grid-template-columns: 1fr; }
}

.form-card {
  background: white; border-radius: 14px; padding: 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
}
.form-card-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f; margin-bottom: 14px;
}

/* ── Espécie ─────────────────────────────────────────────────────── */
.especie-filtro { }
.filtro-label {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #888; margin-bottom: 8px;
}
.especie-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.especie-chip {
  padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e0e0e0;
  background: #fafafa; font-size: .8rem; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.especie-chip:hover  { border-color: #a5d6a7; background: #f1f8e9; }
.especie-chip.active { border-color: #2e7d32; background: #e8f5e9; color: #1b5e20; }

/* ── Sugestões rápidas ───────────────────────────────────────────── */
.sugestoes-box {
  background: #f0f7ff; border-radius: 10px; padding: 10px 12px;
  border: 1px solid #bbdefb;
}
.sugestoes-label {
  font-size: .68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .4px; color: #1565c0; margin-bottom: 7px;
}
.sugestoes-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.sug-chip {
  padding: 4px 10px; border-radius: 16px; border: 1px solid #90caf9;
  background: white; font-size: .75rem; cursor: pointer;
  transition: all .12s; color: #1565c0;
}
.sug-chip:hover { background: #1565c0; color: white; border-color: #1565c0; }

/* ── Insumo qtd badge ────────────────────────────────────────────── */
.insumo-qtd { font-size: .7rem; color: #aaa; }

/* ── Total ───────────────────────────────────────────────────────── */
.total-box {
  background: #e8f5e9; border-radius: 8px; padding: 8px 12px;
  font-size: .9rem; color: #2e7d32;
}

/* ── Histórico ───────────────────────────────────────────────────── */
.hist-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.hist-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .6px; color: #558b2f;
}
.hist-list { display: flex; flex-direction: column; gap: 8px; }
.hist-item {
  background: white; border-radius: 12px; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.06); border: 1px solid rgba(0,0,0,.04);
}
.hist-left  { flex: 1; min-width: 0; }
.hist-nome  { font-weight: 600; font-size: .92rem; color: #1b5e20; }
.hist-sub   { font-size: .75rem; color: #888; margin-top: 2px; }
.hist-right { text-align: right; flex-shrink: 0; }
.hist-total { font-weight: 700; font-size: 1rem; color: #333; }
.hist-data  { font-size: .72rem; color: #aaa; }

.empty-state { text-align: center; padding: 48px 20px; background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06); }
.empty-icon  { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
