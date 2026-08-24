<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Saúde Animal</h1>
        <div class="page-subtitle">Vacinas, medicações e ocorrências</div>
      </div>
    </div>

    <div class="saude-layout">
      <!-- Formulário -->
      <div class="form-col">
        <div class="form-card">
          <div class="form-card-title">Registrar evento</div>

          <q-form @submit="registrar" class="q-gutter-sm">
            <!-- Tipo -->
            <div class="form-label">Tipo de evento</div>
            <div class="tipo-grid">
              <div
                v-for="t in tipos" :key="t.valor"
                class="tipo-item" :class="{ selected: form.tipo === t.valor }"
                @click="form.tipo = t.valor"
              >
                <div class="tipo-emoji">{{ t.emoji }}</div>
                <div class="tipo-label">{{ t.label }}</div>
              </div>
            </div>

            <!-- Alerta morte -->
            <div v-if="form.tipo === 'morte'" class="morte-alerta">
              <q-icon name="warning" color="negative" />
              <span>Registrar morte reduz o total de animais do lote em 1.</span>
            </div>

            <!-- Lote -->
            <div class="form-label">Lote</div>
            <q-select
              v-model="form.loteId"
              :options="opcoesLotes"
              label="Selecionar lote"
              outlined dense clearable
              emit-value map-options
            />

            <q-input v-model="form.data" type="date" label="Data *" outlined dense />

            <q-input
              v-if="['vacina','medicacao','vitamina'].includes(form.tipo)"
              v-model="form.produto"
              label="Produto / Vacina"
              outlined dense
            />

            <div v-if="['vacina','medicacao','vitamina'].includes(form.tipo)" class="row q-gutter-sm">
              <q-input v-model.number="form.doseQtd" type="number" label="Dose" outlined dense class="col" step="0.01" />
              <q-select v-model="form.unidadeDose" :options="['ml','mg','g','dose','comprimido']" label="Unidade" outlined dense class="col" />
            </div>

            <q-input
              v-if="form.tipo === 'morte'"
              v-model="form.causaMortis"
              label="Causa mortis"
              outlined dense
            />

            <q-input v-model.number="form.custo" type="number" label="Custo (R$)" outlined dense step="0.01" />
            <q-input v-model="form.observacao" label="Observação" outlined dense />

            <q-btn
              type="submit"
              :color="form.tipo === 'morte' ? 'negative' : 'primary'"
              :label="form.tipo === 'morte' ? 'Registrar morte' : 'Registrar evento'"
              :icon="form.tipo === 'morte' ? 'warning' : 'vaccines'"
              unelevated no-caps class="full-width q-mt-sm"
              :loading="salvando"
              :disable="!form.tipo || !form.data"
            />
          </q-form>
        </div>
      </div>

      <!-- Histórico -->
      <div class="hist-col">
        <div class="hist-header">
          <div class="hist-title">Histórico de eventos</div>
          <q-btn flat round icon="refresh" size="sm" @click="carregar" :loading="carregando" />
        </div>

        <!-- Filtro tipo -->
        <div class="tipo-filter q-mb-md">
          <div
            class="tipo-chip" :class="{ active: filtroTipo === '' }"
            @click="filtroTipo = ''; carregar()"
          >Todos</div>
          <div
            v-for="t in tipos" :key="t.valor"
            class="tipo-chip" :class="{ active: filtroTipo === t.valor }"
            @click="filtroTipo = t.valor; carregar()"
          >{{ t.emoji }} {{ t.label }}</div>
        </div>

        <div v-if="carregando" class="q-py-xl text-center">
          <q-spinner color="primary" />
        </div>

        <div v-else-if="!eventos.length" class="empty-state">
          <div class="empty-icon">💊</div>
          <div class="empty-msg">Nenhum evento registrado</div>
        </div>

        <div v-else class="hist-list">
          <div v-for="e in eventos" :key="e.id" class="evento-item">
            <div class="ev-badge" :class="`ev-${e.tipo}`">
              {{ tipos.find(t => t.valor === e.tipo)?.emoji ?? '📋' }}
            </div>
            <div class="ev-body">
              <div class="ev-nome">{{ tipos.find(t => t.valor === e.tipo)?.label }} · {{ e.lote?.nome ?? 'Sem lote' }}</div>
              <div class="ev-sub">
                <span v-if="e.produto">{{ e.produto }}</span>
                <span v-if="e.doseQtd"> · {{ e.doseQtd }} {{ e.unidadeDose }}</span>
                <span v-if="e.causaMortis"> · {{ e.causaMortis }}</span>
              </div>
            </div>
            <div class="ev-right">
              <div class="ev-data">{{ formatarData(e.data) }}</div>
              <div v-if="e.custo" class="ev-custo">R$ {{ e.custo.toFixed(2) }}</div>
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

const $q = useQuasar()
const lotesStore = useLotesStore()

const eventos = ref<any[]>([])
const carregando = ref(false)
const salvando = ref(false)
const filtroTipo = ref('')

const tipos = [
  { valor: 'vacina',      emoji: '💉', label: 'Vacina' },
  { valor: 'medicacao',   emoji: '💊', label: 'Medicação' },
  { valor: 'vitamina',    emoji: '🌿', label: 'Vitamina' },
  { valor: 'exame',       emoji: '🔬', label: 'Exame' },
  { valor: 'cirurgia',    emoji: '🏥', label: 'Cirurgia' },
  { valor: 'morte',       emoji: '💀', label: 'Morte' },
]

const form = ref({
  tipo: 'vacina',
  loteId: null as number | null,
  data: new Date().toISOString().split('T')[0],
  produto: '',
  doseQtd: null as number | null,
  unidadeDose: 'ml',
  custo: null as number | null,
  causaMortis: '',
  observacao: '',
})

const opcoesLotes = computed(() =>
  lotesStore.lotesAtivos.map(l => ({ label: l.nome, value: l.id }))
)

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

async function carregar() {
  carregando.value = true
  try {
    const params = filtroTipo.value ? `?tipo=${filtroTipo.value}&limite=50` : '?limite=50'
    eventos.value = await api.get(`/saude${params}`).then(r => r.data)
  } finally {
    carregando.value = false
  }
}

async function registrar() {
  if (!form.value.tipo || !form.value.data) return
  salvando.value = true
  try {
    await api.post('/saude', form.value)
    $q.notify({ type: 'positive', message: 'Evento registrado com sucesso!' })
    form.value = {
      tipo: 'vacina', loteId: null,
      data: new Date().toISOString().split('T')[0],
      produto: '', doseQtd: null, unidadeDose: 'ml',
      custo: null, causaMortis: '', observacao: '',
    }
    await Promise.all([carregar(), lotesStore.carregar()])
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar evento' })
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  await Promise.all([lotesStore.carregar(), carregar()])
})
</script>

<style scoped>
.saude-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 899px) {
  .saude-layout { grid-template-columns: 1fr; }
}

.form-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
}
.form-card-title, .hist-title {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #558b2f;
  margin-bottom: 14px;
}

.form-label {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #558b2f;
  margin-bottom: 8px;
}

.tipo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 4px;
}
.tipo-item {
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  padding: 10px 6px;
  text-align: center;
  cursor: pointer;
  transition: all .2s;
}
.tipo-item:hover    { border-color: #81c784; background: #f9fbe7; }
.tipo-item.selected { border-color: #2e7d32; background: #e8f5e9; }
.tipo-emoji  { font-size: 1.4rem; line-height: 1; }
.tipo-label  { font-size: .68rem; font-weight: 600; color: #555; margin-top: 3px; }

.morte-alerta {
  background: #fdecea;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: .82rem;
  color: #c62828;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Filtro de tipo */
.tipo-filter { display: flex; flex-wrap: wrap; gap: 6px; }
.tipo-chip {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  font-size: .75rem;
  cursor: pointer;
  transition: all .15s;
  background: white;
  white-space: nowrap;
}
.tipo-chip:hover { border-color: #81c784; }
.tipo-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

.hist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hist-list   { display: flex; flex-direction: column; gap: 8px; }

.evento-item {
  background: white;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
  border: 1px solid rgba(0,0,0,.04);
}
.ev-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  background: #f1f8e9;
}
.ev-badge.ev-morte { background: #fdecea; }
.ev-badge.ev-vacina { background: #e3f2fd; }
.ev-badge.ev-medicacao { background: #fce4ec; }

.ev-body { flex: 1; min-width: 0; }
.ev-nome { font-weight: 600; font-size: .9rem; }
.ev-sub  { font-size: .73rem; color: #888; margin-top: 2px; }
.ev-right { text-align: right; flex-shrink: 0; }
.ev-data  { font-size: .72rem; color: #aaa; }
.ev-custo { font-size: .78rem; font-weight: 600; color: #555; margin-top: 2px; }

.empty-state { text-align: center; padding: 48px 20px; background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06); }
.empty-icon  { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
