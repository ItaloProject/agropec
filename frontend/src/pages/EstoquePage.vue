<template>
  <q-page class="std-page">
    <div class="page-header">
      <div>
        <h1>Estoque</h1>
        <div class="page-subtitle">{{ estoqueStore.items.length }} itens cadastrados</div>
      </div>
      <q-btn color="primary" icon="add" label="Novo insumo" @click="abrirForm = true" unelevated no-caps />
    </div>

    <!-- Alertas -->
    <template v-if="estoqueStore.emAlerta.length">
      <div class="section-label-warn">⚠️ Itens em alerta de estoque</div>
      <div class="alerta-grid q-mb-lg">
        <div v-for="item in estoqueStore.emAlerta" :key="item.id" class="alerta-card">
          <q-icon name="warning" color="orange-8" />
          <div class="alerta-body">
            <div class="alerta-nome">{{ item.insumo.nome }}</div>
            <div class="alerta-qtd">
              {{ item.qtdAtual.toFixed(1) }} {{ item.insumo.unidade }}
              <span class="text-grey-6"> / mín {{ item.qtdMinimaAlerta }}</span>
            </div>
          </div>
          <q-btn size="sm" unelevated color="orange-8" label="Comprar" to="/compras" no-caps />
        </div>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="estoqueStore.carregando" class="q-py-xl text-center">
      <q-spinner color="primary" size="2em" />
    </div>

    <!-- Empty -->
    <div v-else-if="!estoqueStore.items.length" class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-msg">Nenhum insumo cadastrado</div>
      <q-btn color="primary" label="Cadastrar primeiro insumo" @click="abrirForm = true" unelevated class="q-mt-md" no-caps />
    </div>

    <template v-else>
      <!-- Cards: mobile -->
      <div class="estoque-cards gt-sm-hide">
        <div v-for="item in estoqueStore.items" :key="item.id" class="estoque-card">
          <div class="ec-header">
            <div class="ec-tipo">{{ tipoLabel(item.insumo.tipo) }}</div>
            <q-chip
              dense size="sm"
              :color="item.qtdAtual <= item.qtdMinimaAlerta ? 'orange' : 'green'"
              text-color="white"
              :label="item.qtdAtual <= item.qtdMinimaAlerta ? 'Crítico' : 'OK'"
            />
          </div>
          <div class="ec-nome">{{ item.insumo.nome }}</div>
          <div class="ec-metrics">
            <div class="ec-m">
              <div class="ec-val">{{ item.qtdAtual.toFixed(1) }} <span class="ec-un">{{ item.insumo.unidade }}</span></div>
              <div class="ec-lbl">Em estoque</div>
            </div>
            <div class="ec-m">
              <div class="ec-val">{{ item.qtdMinimaAlerta ?? '—' }}</div>
              <div class="ec-lbl">Mínimo</div>
            </div>
            <div class="ec-m">
              <div class="ec-val">{{ item.insumo.custoPorUnidade ? `R$ ${item.insumo.custoPorUnidade.toFixed(2)}` : '—' }}</div>
              <div class="ec-lbl">Custo/un</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela: desktop -->
      <div class="estoque-table lt-md-hide">
        <q-table
          :rows="estoqueStore.items"
          :columns="colunas"
          row-key="id"
          flat
          :loading="estoqueStore.carregando"
          hide-bottom
          class="estoque-q-table"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense size="sm"
                :color="props.row.qtdAtual <= props.row.qtdMinimaAlerta ? 'orange' : 'green'"
                text-color="white"
                :label="props.row.qtdAtual <= props.row.qtdMinimaAlerta ? 'Crítico' : 'OK'"
              />
            </q-td>
          </template>
          <template #body-cell-nome="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.insumo.nome }}</div>
              <div class="text-caption text-grey-6">{{ tipoLabel(props.row.insumo.tipo) }}</div>
            </q-td>
          </template>
        </q-table>
      </div>
    </template>

    <!-- Dialog: Novo Insumo -->
    <q-dialog v-model="abrirForm" :maximized="$q.screen.xs">
      <q-card class="form-card">
        <q-card-section class="row items-center bg-primary text-white q-py-sm">
          <q-icon name="inventory_2" size="sm" class="q-mr-sm" />
          <div class="text-h6">Novo Insumo</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pa-md q-gutter-sm">
          <q-input v-model="novoInsumo.nome" label="Nome do insumo *" outlined dense :rules="[v => !!v]" />
          <div class="row q-gutter-sm">
            <q-select v-model="novoInsumo.tipo" :options="tiposOpts" label="Tipo *" outlined dense class="col"
              emit-value map-options />
            <q-select v-model="novoInsumo.unidade" :options="['kg','L','un','saco']" label="Unidade" outlined dense class="col" />
          </div>
          <div class="row q-gutter-sm">
            <q-input v-model.number="novoInsumo.custoPorUnidade" type="number" label="Custo/unidade (R$)" outlined dense class="col" />
            <q-input v-model.number="novoInsumo.qtdMinimaAlerta" type="number" label="Estoque mínimo" outlined dense class="col" />
          </div>
          <q-input v-model.number="novoInsumo.qtdInicial" type="number" label="Quantidade inicial" outlined dense />
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancelar" v-close-popup no-caps />
          <q-btn color="primary" label="Cadastrar" @click="cadastrar" :loading="salvando" unelevated no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useEstoqueStore } from 'src/stores/estoque.store'

const $q = useQuasar()
const estoqueStore = useEstoqueStore()

const abrirForm = ref(false)
const salvando = ref(false)

const tiposOpts = [
  { label: 'Ração', value: 'racao' },
  { label: 'Concentrado', value: 'concentrado' },
  { label: 'Volumoso', value: 'volumoso' },
  { label: 'Suplemento', value: 'suplemento' },
  { label: 'Medicamento', value: 'medicamento' },
  { label: 'Outro', value: 'outro' },
]

const tipoLabel = (tipo: string) =>
  tiposOpts.find(t => t.value === tipo)?.label ?? tipo

const novoInsumo = ref({
  nome: '', tipo: 'racao', unidade: 'kg',
  custoPorUnidade: null as number | null,
  qtdInicial: null as number | null,
  qtdMinimaAlerta: null as number | null,
})

const colunas = [
  { name: 'nome',    label: 'Insumo',      field: (r: any) => r.insumo.nome,   sortable: true,  align: 'left' as const },
  { name: 'qtd',    label: 'Em estoque',   field: (r: any) => `${r.qtdAtual.toFixed(1)} ${r.insumo.unidade}`, sortable: true,  align: 'right' as const },
  { name: 'minimo', label: 'Estoque mín.', field: (r: any) => `${r.qtdMinimaAlerta ?? '—'} ${r.insumo.unidade}`, align: 'right' as const },
  { name: 'custo',  label: 'Custo/un',     field: (r: any) => r.insumo.custoPorUnidade ? `R$ ${r.insumo.custoPorUnidade.toFixed(2)}` : '—', align: 'right' as const },
  { name: 'status', label: 'Status',       field: 'status', align: 'center' as const },
]

async function cadastrar() {
  salvando.value = true
  try {
    await estoqueStore.cadastrarInsumo(novoInsumo.value as any)
    abrirForm.value = false
    $q.notify({ type: 'positive', message: 'Insumo cadastrado!' })
    novoInsumo.value = { nome: '', tipo: 'racao', unidade: 'kg', custoPorUnidade: null, qtdInicial: null, qtdMinimaAlerta: null }
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao cadastrar' })
  } finally {
    salvando.value = false
  }
}

onMounted(() => estoqueStore.carregar())
</script>

<style scoped>
.section-label-warn {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #e65100;
  margin-bottom: 10px;
}

.alerta-grid { display: flex; flex-direction: column; gap: 8px; }
.alerta-card {
  background: #fff8f0;
  border-left: 3px solid #e65100;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.alerta-body { flex: 1; }
.alerta-nome { font-weight: 600; font-size: .9rem; }
.alerta-qtd  { font-size: .78rem; color: #e65100; }

/* Cards mobile */
.estoque-cards { display: flex; flex-direction: column; gap: 10px; }
.estoque-card {
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
}
.ec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ec-tipo   { font-size: .68rem; text-transform: uppercase; letter-spacing: .5px; color: #888; font-weight: 600; }
.ec-nome   { font-weight: 600; font-size: 1rem; color: #1b5e20; margin-bottom: 10px; }
.ec-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.ec-m      { text-align: center; }
.ec-val    { font-weight: 700; font-size: .95rem; color: #333; }
.ec-un     { font-weight: 400; font-size: .75rem; color: #888; }
.ec-lbl    { font-size: .62rem; color: #aaa; text-transform: uppercase; margin-top: 1px; }

/* Table desktop */
.estoque-table { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,.07); }

.form-card { width: 480px; max-width: 100%; }

/* Visibility helpers */
.gt-sm-hide { display: block; }
@media (min-width: 900px) { .gt-sm-hide { display: none !important; } }
.lt-md-hide { display: block; }
@media (max-width: 899px) { .lt-md-hide { display: none !important; } }

.empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06); }
.empty-icon  { font-size: 3rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
