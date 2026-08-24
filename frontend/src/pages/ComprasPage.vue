<template>
  <q-page class="std-page">
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

          <q-form @submit="registrarCompra" class="q-gutter-sm">
            <q-select
              v-model="form.insumoId"
              :options="opcoesInsumos"
              label="Insumo *"
              outlined dense
              emit-value map-options
              :rules="[v => !!v || 'Selecione o insumo']"
            />

            <div class="row q-gutter-sm">
              <q-input
                v-model.number="form.quantidade"
                type="number" label="Quantidade *"
                outlined dense class="col"
                :rules="[v => v > 0 || 'Obrigatório']"
                step="0.01"
              />
              <q-input
                v-model.number="form.valorUnitario"
                type="number" label="Valor unitário (R$) *"
                outlined dense class="col"
                :rules="[v => v >= 0 || 'Obrigatório']"
                step="0.01"
              />
            </div>

            <div v-if="totalCompra" class="total-box">
              Total da compra: <strong>R$ {{ totalCompra.toFixed(2) }}</strong>
            </div>

            <q-input v-model="form.data" type="date" label="Data da compra *" outlined dense />

            <q-select
              v-model="form.fornecedorId"
              :options="opcoesFornecedores"
              label="Fornecedor (opcional)"
              outlined dense clearable
              emit-value map-options
            />

            <q-input v-model="form.notaFiscal" label="Nota fiscal / NF" outlined dense />
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
              <div class="hist-total">R$ {{ c.valorTotal?.toFixed(2) ?? (c.quantidade * c.valorUnitario).toFixed(2) }}</div>
              <div class="hist-data">{{ formatarData(c.data) }}</div>
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
import { useEstoqueStore } from 'src/stores/estoque.store'

const $q = useQuasar()
const estoqueStore = useEstoqueStore()

const compras = ref<any[]>([])
const fornecedores = ref<any[]>([])
const carregando = ref(false)
const salvando = ref(false)

const form = ref({
  insumoId: null as number | null,
  fornecedorId: null as number | null,
  data: new Date().toISOString().split('T')[0],
  quantidade: null as number | null,
  valorUnitario: null as number | null,
  notaFiscal: '',
  observacao: '',
})

const opcoesInsumos = computed(() =>
  estoqueStore.items.map(i => ({ label: `${i.insumo.nome} (${i.qtdAtual.toFixed(1)} ${i.insumo.unidade})`, value: i.insumo.id }))
)

const opcoesFornecedores = computed(() =>
  fornecedores.value.map(f => ({ label: f.nome, value: f.id }))
)

const totalCompra = computed(() => {
  if (!form.value.quantidade || !form.value.valorUnitario) return null
  return form.value.quantidade * form.value.valorUnitario
})

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data + 'T12:00:00'))
}

async function carregar() {
  carregando.value = true
  try {
    const [c, f] = await Promise.all([
      api.get('/compras?limite=50').then(r => r.data),
      api.get('/compras/fornecedores').then(r => r.data),
    ])
    compras.value = c
    fornecedores.value = f
  } finally {
    carregando.value = false
  }
}

async function registrarCompra() {
  if (!form.value.insumoId || !form.value.quantidade || form.value.valorUnitario == null) return
  salvando.value = true
  try {
    await api.post('/compras', form.value)
    $q.notify({ type: 'positive', message: 'Compra registrada! Estoque atualizado.' })
    form.value = {
      insumoId: null, fornecedorId: null,
      data: new Date().toISOString().split('T')[0],
      quantidade: null, valorUnitario: null,
      notaFiscal: '', observacao: '',
    }
    await Promise.all([carregar(), estoqueStore.carregar()])
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar compra' })
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  await Promise.all([estoqueStore.carregar(), carregar()])
})
</script>

<style scoped>
.compras-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 899px) {
  .compras-layout { grid-template-columns: 1fr; }
}

.form-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 8px rgba(0,0,0,.07);
  border: 1px solid rgba(0,0,0,.04);
}
.form-card-title {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #558b2f;
  margin-bottom: 14px;
}

.total-box {
  background: #e8f5e9;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: .9rem;
  color: #2e7d32;
}

.hist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.hist-title {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #558b2f;
}

.hist-list { display: flex; flex-direction: column; gap: 8px; }
.hist-item {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,.06);
  border: 1px solid rgba(0,0,0,.04);
}
.hist-left { flex: 1; min-width: 0; }
.hist-nome { font-weight: 600; font-size: .92rem; color: #1b5e20; }
.hist-sub  { font-size: .75rem; color: #888; margin-top: 2px; }
.hist-right { text-align: right; flex-shrink: 0; }
.hist-total { font-weight: 700; font-size: 1rem; color: #333; }
.hist-data  { font-size: .72rem; color: #aaa; }

.empty-state { text-align: center; padding: 48px 20px; background: white; border-radius: 14px; box-shadow: 0 1px 8px rgba(0,0,0,.06); }
.empty-icon  { font-size: 2.5rem; margin-bottom: 8px; }
.empty-msg   { color: #aaa; font-size: .9rem; }
.page-subtitle { font-size: .82rem; color: #888; margin-top: 2px; }
</style>
