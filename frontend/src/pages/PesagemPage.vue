<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Pesagem</h1>
        <div class="page-subtitle">Ranking de peso por lote e por animal</div>
      </div>
      <div class="tab-switch">
        <button class="tab-btn" :class="{ active: guia === 'lote' }" @click="guia = 'lote'">
          Por Lote
        </button>
        <button class="tab-btn" :class="{ active: guia === 'unidade' }" @click="guia = 'unidade'">
          Por Animal
        </button>
      </div>
    </div>

    <!-- ════ POR LOTE ════════════════════════════════════════════════ -->
    <template v-if="guia === 'lote'">

      <!-- Resumo strip -->
      <div class="resumo-strip q-mb-lg">
        <div class="rs-item">
          <div class="rs-val">{{ lotesOrdenados.length }}</div>
          <div class="rs-lbl">Lotes ativos</div>
        </div>
        <div class="rs-div"/>
        <div class="rs-item">
          <div class="rs-val">{{ totalAnimais }}</div>
          <div class="rs-lbl">Animais</div>
        </div>
        <div class="rs-div"/>
        <div class="rs-item">
          <div class="rs-val">{{ pesoTotalRebanho.toFixed(0) }} kg</div>
          <div class="rs-lbl">Peso total rebanho</div>
        </div>
        <div class="rs-div"/>
        <div class="rs-item">
          <div class="rs-val text-positive">R$ {{ valorTotalRebanho.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) }}</div>
          <div class="rs-lbl">Valor estimado total</div>
        </div>
      </div>

      <!-- Lista de lotes por peso -->
      <div v-if="!lotesOrdenados.length" class="empty-state">
        <div class="empty-icon">⚖️</div>
        <div class="empty-msg">Nenhum lote ativo com peso registrado</div>
      </div>

      <div v-else class="ranking-list">
        <div v-for="(lote, idx) in lotesOrdenados" :key="lote.id" class="rank-card">
          <!-- Posição -->
          <div class="rank-pos" :class="['pos-' + (idx + 1)]">
            {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
          </div>

          <!-- Info -->
          <div class="rank-body">
            <div class="rank-top">
              <span class="rank-emoji">{{ getEmoji(lote.especie) }}</span>
              <span class="rank-nome">{{ lote.nome }}</span>
              <span class="rank-tag" v-if="lote.finalidade">{{ lote.finalidade }}</span>
              <span class="rank-tag fase" v-if="lote.fase">{{ lote.fase }}</span>
            </div>
            <div class="rank-bar-wrap">
              <div class="rank-bar" :style="{ width: barPercent(lote) + '%' }" />
            </div>
          </div>

          <!-- Métricas -->
          <div class="rank-stats">
            <div class="rank-stat">
              <div class="stat-val">{{ lote.qtdAtual }}</div>
              <div class="stat-lbl">cab.</div>
            </div>
            <div class="rank-stat">
              <div class="stat-val">{{ lote.pesoMedioAtual?.toFixed(1) ?? '—' }} kg</div>
              <div class="stat-lbl">peso médio</div>
            </div>
            <div class="rank-stat">
              <div class="stat-val">{{ pesoTotalLote(lote).toFixed(0) }} kg</div>
              <div class="stat-lbl">peso total</div>
            </div>
            <div class="rank-stat rank-stat--valor">
              <div class="stat-val text-positive">R$ {{ valorLote(lote).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) }}</div>
              <div class="stat-lbl">val. estimado · {{ precoKgLote(lote).toFixed(2) }}/kg</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ════ POR ANIMAL ═══════════════════════════════════════════════ -->
    <template v-if="guia === 'unidade'">

      <!-- Resumo strip -->
      <div class="resumo-strip q-mb-md">
        <div class="rs-item">
          <div class="rs-val">{{ animaisOrdenados.length }}</div>
          <div class="rs-lbl">Animais com peso</div>
        </div>
        <div class="rs-div"/>
        <div class="rs-item">
          <div class="rs-val">{{ pesoMedioAnimais.toFixed(1) }} kg</div>
          <div class="rs-lbl">Peso médio</div>
        </div>
        <div class="rs-div"/>
        <div class="rs-item">
          <div class="rs-val text-positive">{{ animaisOrdenados[0]?.pesoEntrada?.toFixed(1) ?? '—' }} kg</div>
          <div class="rs-lbl">Mais pesado</div>
        </div>
        <div class="rs-div"/>
        <div class="rs-item">
          <div class="rs-val text-grey-6">{{ animaisOrdenados[animaisOrdenados.length - 1]?.pesoEntrada?.toFixed(1) ?? '—' }} kg</div>
          <div class="rs-lbl">Mais leve</div>
        </div>
      </div>

      <!-- Filtro de lote -->
      <div class="filtro-chips q-mb-md">
        <div class="filtro-chip" :class="{ active: filtroLote === null }" @click="filtroLote = null">Todos</div>
        <div
          v-for="l in lotesComAnimais" :key="l.id"
          class="filtro-chip" :class="{ active: filtroLote === l.id }"
          @click="filtroLote = l.id"
        >{{ getEmoji(l.especie) }} {{ l.nome }}</div>
      </div>

      <div v-if="carregando" class="q-py-xl text-center"><q-spinner color="primary" size="lg" /></div>

      <div v-else-if="!animaisFiltrados.length" class="empty-state">
        <div class="empty-icon">🐄</div>
        <div class="empty-msg">Nenhum animal com peso registrado</div>
      </div>

      <!-- Tabela de animais -->
      <div v-else class="animal-table">
        <div class="at-head">
          <div>#</div>
          <div>Animal</div>
          <div>Lote</div>
          <div>Peso</div>
          <div>Valor est.</div>
        </div>

        <div v-for="(a, idx) in animaisFiltrados" :key="a.id" class="at-row">
          <div class="at-rank">
            {{ idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1 }}
          </div>
          <div class="at-id">
            <div class="at-brinco">{{ a.brinco ? '#' + a.brinco : '—' }}</div>
            <div class="at-sub">{{ a.raca ?? 'Raça n/i' }} · {{ a.sexo === 'macho' ? '♂ Macho' : a.sexo === 'femea' ? '♀ Fêmea' : '—' }}</div>
          </div>
          <div class="at-lote">
            <span>{{ getEmoji(a.lote?.especie ?? '') }} {{ a.lote?.nome ?? '—' }}</span>
          </div>
          <div class="at-peso-col">
            <div class="at-peso-val">{{ a.pesoEntrada?.toFixed(1) ?? '—' }} kg</div>
            <div class="at-peso-bar-wrap">
              <div class="at-peso-bar" :style="{ width: animalBarPercent(a) + '%' }" />
            </div>
          </div>
          <div class="at-valor">
            <div class="at-valor-val text-positive">R$ {{ valorAnimal(a).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) }}</div>
            <div class="at-valor-sub">{{ precoKgAnimal(a).toFixed(2) }}/kg</div>
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
const { getEmoji } = useEspecies()

const guia      = ref<'lote' | 'unidade'>('lote')
const animais   = ref<any[]>([])
const carregando = ref(false)
const filtroLote = ref<number | null>(null)

// ── Preços por espécie/finalidade (R$/kg) ────────────────────────
const PRECO_KG: Record<string, number> = {
  bovino_corte: 12.5, bovino_leite: 8.0, bovino_reproducao: 15.0,
  suino_corte: 8.5,
  ovino_corte: 18.0, caprino_corte: 16.0,
  equino_esporte: 25.0, equino_trabalho: 18.0,
  avicultura_corte: 6.5, avicultura_postura: 5.0,
  piscicultura_piscicultura: 12.0,
}

function precoKgPorEspecieFinalidade(especie?: string, finalidade?: string): number {
  const e = especie ?? ''
  const f = finalidade ?? ''
  return PRECO_KG[`${e}_${f}`] ?? PRECO_KG[e] ?? 10.0
}

// ── GUIA LOTE ────────────────────────────────────────────────────
function pesoTotalLote(lote: any): number {
  return (lote.pesoMedioAtual ?? 0) * lote.qtdAtual
}
function precoKgLote(lote: any): number {
  return precoKgPorEspecieFinalidade(lote.especie, lote.finalidade)
}
function valorLote(lote: any): number {
  return pesoTotalLote(lote) * precoKgLote(lote)
}

const lotesOrdenados = computed(() =>
  [...lotesStore.lotesAtivos]
    .filter(l => l.pesoMedioAtual || l.pesoMedioEntrada)
    .map(l => ({ ...l, pesoMedioAtual: l.pesoMedioAtual ?? l.pesoMedioEntrada }))
    .sort((a, b) => pesoTotalLote(b) - pesoTotalLote(a))
)

const maxPesoLote = computed(() =>
  lotesOrdenados.value.length ? pesoTotalLote(lotesOrdenados.value[0]!) : 1
)
function barPercent(lote: any): number {
  return Math.max(4, (pesoTotalLote(lote) / maxPesoLote.value) * 100)
}

const totalAnimais        = computed(() => lotesStore.lotesAtivos.reduce((s, l) => s + l.qtdAtual, 0))
const pesoTotalRebanho    = computed(() => lotesOrdenados.value.reduce((s, l) => s + pesoTotalLote(l), 0))
const valorTotalRebanho   = computed(() => lotesOrdenados.value.reduce((s, l) => s + valorLote(l), 0))

// ── GUIA ANIMAL ──────────────────────────────────────────────────
function precoKgAnimal(a: any): number {
  return precoKgPorEspecieFinalidade(a.lote?.especie, a.lote?.finalidade)
}
function valorAnimal(a: any): number {
  return (a.pesoEntrada ?? 0) * precoKgAnimal(a)
}

const animaisOrdenados = computed(() =>
  [...animais.value]
    .filter(a => a.pesoEntrada)
    .sort((a, b) => (b.pesoEntrada ?? 0) - (a.pesoEntrada ?? 0))
)

const animaisFiltrados = computed(() =>
  filtroLote.value
    ? animaisOrdenados.value.filter(a => a.loteId === filtroLote.value)
    : animaisOrdenados.value
)

const lotesComAnimais = computed(() => {
  const map = new Map<number, any>()
  animaisOrdenados.value.forEach(a => { if (a.lote) map.set(a.lote.id, a.lote) })
  return [...map.values()]
})

const pesoMedioAnimais = computed(() => {
  const lista = animaisOrdenados.value
  if (!lista.length) return 0
  return lista.reduce((s, a) => s + (a.pesoEntrada ?? 0), 0) / lista.length
})

const maxPesoAnimal = computed(() =>
  animaisOrdenados.value[0]?.pesoEntrada ?? 1
)
function animalBarPercent(a: any): number {
  return Math.max(4, ((a.pesoEntrada ?? 0) / maxPesoAnimal.value) * 100)
}

// ── Carregamento ─────────────────────────────────────────────────
async function carregar() {
  carregando.value = true
  try {
    animais.value = await api.get('/animais?status=ativo').then(r => r.data)
  } finally {
    carregando.value = false
  }
}

onMounted(async () => {
  await Promise.all([lotesStore.carregar(), carregar()])
})
</script>

<style scoped>
/* ── Tab switch ──────────────────────────────────────────────── */
.tab-switch {
  display: flex; gap: 4px; background: #f0f0f0;
  border-radius: 10px; padding: 3px;
}
.tab-btn {
  padding: 7px 18px; border: none; border-radius: 8px;
  font-size: .75rem; font-weight: 700; cursor: pointer; transition: all .2s;
  background: transparent; color: #888;
}
.tab-btn.active { background: white; color: #2e7d32; box-shadow: 0 1px 4px rgba(0,0,0,.1); }

/* ── Resumo strip ────────────────────────────────────────────── */
.resumo-strip {
  background: white; border-radius: 14px; padding: 14px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.rs-item { flex: 1; text-align: center; min-width: 90px; }
.rs-div  { width: 1px; height: 32px; background: #e8e8e8; flex-shrink: 0; }
.rs-val  { font-size: 1.15rem; font-weight: 700; color: #1b5e20; }
.rs-lbl  { font-size: .63rem; color: #aaa; text-transform: uppercase; margin-top: 2px; }

/* ── Ranking lotes ───────────────────────────────────────────── */
.ranking-list { display: flex; flex-direction: column; gap: 10px; }

.rank-card {
  background: white; border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.06); border: 1px solid rgba(0,0,0,.04);
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.rank-pos  { font-size: 1.4rem; width: 36px; text-align: center; flex-shrink: 0; }
.pos-1 { filter: drop-shadow(0 0 4px rgba(255,200,0,.4)); }

.rank-body { flex: 1; min-width: 140px; }
.rank-top  { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; flex-wrap: wrap; }
.rank-emoji { font-size: 1.2rem; }
.rank-nome  { font-weight: 700; font-size: 1rem; color: #1b5e20; }
.rank-tag {
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  padding: 2px 7px; border-radius: 10px; letter-spacing: .4px;
  background: #fdecea; color: #b71c1c;
}
.rank-tag.fase { background: #e8f5e9; color: #2e7d32; }

.rank-bar-wrap { background: #f5f5f5; border-radius: 6px; height: 6px; overflow: hidden; }
.rank-bar { height: 100%; background: linear-gradient(90deg, #66bb6a, #2e7d32); border-radius: 6px; transition: width .4s ease; }

.rank-stats { display: flex; gap: 20px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
.rank-stat  { text-align: center; min-width: 70px; }
.rank-stat--valor { min-width: 110px; }
.stat-val { font-weight: 700; font-size: .95rem; color: #333; white-space: nowrap; }
.stat-lbl { font-size: .6rem; color: #aaa; text-transform: uppercase; margin-top: 1px; }

/* ── Tabela animais ──────────────────────────────────────────── */
.animal-table {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
}
.at-head {
  display: grid; grid-template-columns: 44px 2fr 1.5fr 160px 140px;
  padding: 10px 20px; background: #f9fbe7; border-bottom: 1px solid #e8f5e9;
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #558b2f;
}
.at-row {
  display: grid; grid-template-columns: 44px 2fr 1.5fr 160px 140px;
  padding: 12px 20px; border-bottom: 1px solid #f5f5f5; align-items: center;
}
.at-row:last-child { border-bottom: none; }
.at-row:hover { background: #fafafa; }

.at-rank   { font-size: 1.1rem; }
.at-brinco { font-weight: 700; font-size: .92rem; color: #1b5e20; }
.at-sub    { font-size: .72rem; color: #aaa; margin-top: 2px; }
.at-lote   { font-size: .82rem; color: #555; }

.at-peso-val { font-weight: 700; font-size: .95rem; color: #1b5e20; margin-bottom: 5px; }
.at-peso-bar-wrap { background: #f5f5f5; border-radius: 4px; height: 5px; overflow: hidden; }
.at-peso-bar { height: 100%; background: linear-gradient(90deg, #66bb6a, #2e7d32); border-radius: 4px; transition: width .4s; }

.at-valor-val { font-weight: 700; font-size: .92rem; }
.at-valor-sub { font-size: .65rem; color: #aaa; margin-top: 2px; }

/* ── Filtro chips ────────────────────────────────────────────── */
.filtro-chips { display: flex; flex-wrap: wrap; gap: 6px; overflow-x: auto; }
.filtro-chip {
  padding: 5px 14px; border-radius: 20px; border: 1px solid #ddd;
  background: white; font-size: .78rem; cursor: pointer; transition: all .15s; white-space: nowrap;
}
.filtro-chip:hover  { border-color: #81c784; }
.filtro-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

/* ── Responsivo ──────────────────────────────────────────────── */
@media (max-width: 700px) {
  .at-head, .at-row { grid-template-columns: 36px 1fr 100px 90px; }
  .at-head > div:nth-child(3),
  .at-row  > div:nth-child(3) { display: none; }
  .rank-stats { gap: 12px; }
}

/* ── Empty ───────────────────────────────────────────────────── */
.empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06); }
.empty-icon  { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
