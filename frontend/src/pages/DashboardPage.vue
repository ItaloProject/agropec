<template>
  <q-page class="dashboard-page">
    <!-- Page Header -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Olá, {{ authStore.usuario?.nome?.split(' ')[0] }} 👋</h1>
        <div class="dash-subtitle">{{ dataAtual }}</div>
      </div>
      <q-btn
        color="primary"
        icon="refresh"
        round
        flat
        @click="carregar"
        :loading="carregando"
        size="md"
      />
    </div>

    <!-- Alertas -->
    <template v-if="dashboard?.insumosEmAlerta?.length">
      <div
        v-for="alerta in dashboard.insumosEmAlerta"
        :key="alerta.nome"
        class="alerta-estoque q-mb-sm"
      >
        <q-icon name="warning" color="orange-8" size="sm" />
        <span>
          <strong>{{ alerta.nome }}</strong> — estoque crítico:
          {{ alerta.qtdAtual.toFixed(1) }} (mínimo: {{ alerta.qtdMinima.toFixed(1) }})
        </span>
        <q-space />
        <q-btn size="sm" flat color="orange-8" label="Comprar" to="/compras" />
      </div>
    </template>

    <!-- KPI Grid -->
    <div class="kpi-section-label">Resumo de hoje</div>
    <div class="kpi-grid">
      <div class="kpi-card kpi-primary">
        <div class="kpi-icon-wrap kpi-icon-green">🐄</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ dashboard?.totalAnimais ?? '—' }}</div>
          <div class="kpi-label">Animais ativos</div>
          <div class="kpi-unit">cabeças</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon-blue">🏷️</div>
        <div class="kpi-body">
          <div class="kpi-value kpi-blue">{{ dashboard?.totalLotes ?? '—' }}</div>
          <div class="kpi-label">Lotes ativos</div>
          <div class="kpi-unit">confinamentos</div>
        </div>
      </div>

      <div class="kpi-card" :class="{ 'kpi-alert': alertaRacao }">
        <div class="kpi-icon-wrap" :class="alertaRacao ? 'kpi-icon-orange' : 'kpi-icon-amber'">🌾</div>
        <div class="kpi-body">
          <div class="kpi-value" :class="alertaRacao ? 'kpi-orange' : 'kpi-amber'">
            {{ dashboard?.consumoRacaoHojeKg?.toFixed(1) ?? '0' }} <span class="kpi-unit-inline">kg</span>
          </div>
          <div class="kpi-label">Ração fornecida</div>
          <div class="kpi-unit">hoje</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap kpi-icon-teal">💰</div>
        <div class="kpi-body">
          <div class="kpi-value kpi-teal">
            R$&nbsp;{{ dashboard?.custoAlimentacaoHoje?.toFixed(2) ?? '0,00' }}
          </div>
          <div class="kpi-label">Custo alimentação</div>
          <div class="kpi-unit">hoje</div>
        </div>
      </div>
    </div>

    <!-- Ações rápidas + Lotes: side-by-side on desktop -->
    <div class="dash-body">
      <!-- Coluna esquerda: ações rápidas -->
      <div class="dash-col-left">
        <div class="section-title">Ações rápidas</div>
        <div class="acoes-grid">
          <q-btn
            color="primary"
            icon-right="chevron_right"
            label="Registrar alimentação"
            to="/alimentacao"
            unelevated
            class="acao-btn"
            align="left"
          />
          <q-btn
            color="secondary"
            icon-right="chevron_right"
            label="Registrar pesagem"
            to="/pesagem"
            outline
            class="acao-btn"
            align="left"
          />
          <q-btn
            color="grey-8"
            icon-right="chevron_right"
            label="Registrar compra"
            to="/compras"
            outline
            class="acao-btn"
            align="left"
          />
          <q-btn
            color="teal-7"
            icon-right="chevron_right"
            label="Gerenciar estoque"
            to="/estoque"
            flat
            class="acao-btn"
            align="left"
          />
        </div>

        <!-- Saúde / Relatórios links -->
        <div class="section-title q-mt-lg">Módulos</div>
        <div class="modulos-grid">
          <div class="modulo-card" @click="$router.push('/saude')">
            <span class="modulo-icon">💊</span>
            <span class="modulo-label">Saúde Animal</span>
          </div>
          <div class="modulo-card" @click="$router.push('/relatorios')">
            <span class="modulo-icon">📋</span>
            <span class="modulo-label">Relatórios</span>
          </div>
          <div class="modulo-card" @click="$router.push('/lotes')">
            <span class="modulo-icon">🏷️</span>
            <span class="modulo-label">Lotes</span>
          </div>
        </div>
      </div>

      <!-- Coluna direita: lotes ativos -->
      <div class="dash-col-right">
        <div class="section-title">Lotes em atividade</div>

        <div v-if="lotesStore.carregando" class="q-py-xl text-center">
          <q-spinner color="primary" size="2.5em" />
        </div>

        <div v-else-if="!lotesStore.lotesAtivos.length" class="empty-lotes">
          <div class="empty-icon">🐄</div>
          <div class="empty-msg">Nenhum lote ativo</div>
          <q-btn color="primary" label="Criar primeiro lote" to="/lotes" unelevated size="sm" class="q-mt-md" />
        </div>

        <div v-else class="lotes-list">
          <div
            v-for="lote in lotesStore.lotesAtivos"
            :key="lote.id"
            class="lote-card"
            @click="$router.push('/lotes')"
          >
            <div class="lote-header">
              <div class="lote-especie-badge">{{ useEspecies().getEmoji(lote.especie) }}</div>
              <div class="lote-info">
                <div class="lote-nome">{{ lote.nome }}</div>
                <div class="lote-meta">
                  {{ useEspecies().getLabel(lote.especie) }}
                  <span v-if="lote.fase"> · {{ lote.fase }}</span>
                  <span v-if="lote.localizacao"> · {{ lote.localizacao }}</span>
                </div>
              </div>
              <q-icon name="chevron_right" color="grey-4" size="sm" class="q-ml-auto" />
            </div>
            <div class="lote-metrics">
              <div class="metric">
                <div class="val">{{ lote.qtdAtual }}</div>
                <div class="lbl">Cabeças</div>
              </div>
              <div class="metric-divider" />
              <div class="metric">
                <div class="val">{{ lote.pesoMedioAtual?.toFixed(1) ?? '—' }}</div>
                <div class="lbl">Peso médio (kg)</div>
              </div>
              <div class="metric-divider" />
              <div class="metric">
                <div class="val">{{ diasConfinamento(lote.dataEntrada) }}</div>
                <div class="lbl">Dias</div>
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
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'
import { useLotesStore } from 'src/stores/lotes.store'
import { useEspecies } from 'src/composables/useEspecies'

const authStore = useAuthStore()
const lotesStore = useLotesStore()

const dashboard = ref<any>(null)
const carregando = ref(false)

const dataAtual = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long',
}).format(new Date())

const alertaRacao = computed(
  () => (dashboard.value?.consumoRacaoHojeKg ?? 0) === 0
)

function diasConfinamento(dataEntrada: string) {
  return Math.floor(
    (Date.now() - new Date(dataEntrada).getTime()) / (1000 * 60 * 60 * 24)
  )
}

async function carregar() {
  carregando.value = true
  try {
    const [dash] = await Promise.all([
      api.get('/dashboard').then(r => r.data),
      lotesStore.carregar(),
    ])
    dashboard.value = dash
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
/* ── Page container ──────────────────────────────────────────── */
.dashboard-page {
  background: #f4f6f0;
  min-height: 100vh;
  padding: 28px 32px;
}

@media (max-width: 599px) {
  .dashboard-page { padding: 16px 14px; }
}

/* ── Header ──────────────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.dash-title {
  font-size: 1.7rem;
  font-weight: 700;
  color: #1b5e20;
  margin: 0 0 4px;
  line-height: 1.1;
}

.dash-subtitle {
  font-size: 0.85rem;
  color: #777;
  text-transform: capitalize;
}

@media (max-width: 599px) {
  .dash-title { font-size: 1.3rem; }
}

/* ── KPI Grid ────────────────────────────────────────────────── */
.kpi-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #558b2f;
  margin-bottom: 12px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}

@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}

@media (max-width: 450px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
}

.kpi-card {
  background: white;
  border-radius: 14px;
  padding: 18px 16px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: box-shadow 0.2s, transform 0.15s;
  border: 1px solid rgba(0,0,0,.04);
}

.kpi-card:hover {
  box-shadow: 0 4px 18px rgba(0,0,0,.11);
  transform: translateY(-1px);
}

.kpi-card.kpi-alert {
  border-left: 3px solid #e65100;
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.kpi-icon-green { background: #e8f5e9; }
.kpi-icon-blue  { background: #e3f2fd; }
.kpi-icon-amber { background: #fff8e1; }
.kpi-icon-orange{ background: #fff3e0; }
.kpi-icon-teal  { background: #e0f2f1; }

.kpi-body { flex: 1; min-width: 0; }

.kpi-value {
  font-size: 1.65rem;
  font-weight: 700;
  color: #2e7d32;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value.kpi-blue   { color: #1565c0; }
.kpi-value.kpi-amber  { color: #f57f17; }
.kpi-value.kpi-orange { color: #e65100; }
.kpi-value.kpi-teal   { color: #00695c; }

.kpi-unit-inline {
  font-size: 0.9rem;
  font-weight: 400;
  color: #999;
}

.kpi-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #888;
  margin-top: 4px;
}

.kpi-unit {
  font-size: 0.68rem;
  color: #bbb;
}

@media (max-width: 599px) {
  .kpi-card { padding: 14px 12px; gap: 10px; }
  .kpi-icon-wrap { width: 40px; height: 40px; font-size: 1.2rem; border-radius: 10px; }
  .kpi-value { font-size: 1.3rem; }
}

/* ── Body: 2 columns on desktop ──────────────────────────────── */
.dash-body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 900px) {
  .dash-body { grid-template-columns: 1fr; }
}

/* ── Left column ─────────────────────────────────────────────── */
.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #558b2f;
  margin-bottom: 10px;
}

.acoes-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acao-btn {
  width: 100%;
  justify-content: space-between;
  border-radius: 10px !important;
  font-size: 0.85rem;
  padding: 10px 14px;
}

.modulos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.modulo-card {
  background: white;
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
  border: 1px solid rgba(0,0,0,.04);
  transition: box-shadow 0.15s, transform 0.12s;
}

.modulo-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,.1);
  transform: translateY(-1px);
}

.modulo-icon { font-size: 1.5rem; display: block; margin-bottom: 6px; }
.modulo-label { font-size: 0.68rem; color: #555; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }

/* ── Lotes list ──────────────────────────────────────────────── */
.lotes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lote-card {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  border: 1px solid rgba(0,0,0,.04);
}

.lote-card:hover {
  box-shadow: 0 5px 20px rgba(0,0,0,.12);
  transform: translateY(-1px);
}

.lote-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f8e9;
}

.lote-especie-badge {
  font-size: 1.6rem;
  width: 46px;
  height: 46px;
  background: #f1f8e9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lote-info { flex: 1; min-width: 0; }

.lote-nome {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1b5e20;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lote-meta {
  font-size: 0.75rem;
  color: #888;
  margin-top: 2px;
}

.lote-metrics {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 0;
}

.metric {
  flex: 1;
  text-align: center;
}

.metric-divider {
  width: 1px;
  height: 32px;
  background: #f0f0f0;
  flex-shrink: 0;
}

.metric .val {
  font-weight: 700;
  font-size: 1.15rem;
  color: #1b5e20;
}

.metric .lbl {
  font-size: 0.65rem;
  color: #999;
  text-transform: uppercase;
  margin-top: 2px;
}

/* ── Empty state ─────────────────────────────────────────────── */
.empty-lotes {
  background: white;
  border-radius: 14px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 1px 8px rgba(0,0,0,.06);
}

.empty-icon { font-size: 3rem; margin-bottom: 8px; }
.empty-msg  { color: #aaa; font-size: 0.9rem; }
</style>
