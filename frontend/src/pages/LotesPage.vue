<template>
  <q-page class="std-page">

    <!-- ── Guias principais ───────────────────────────────────────── -->
    <div class="guias-header">
      <div class="guias-tabs">
        <button class="guia-btn" :class="{ active: guiaPrincipal === 'lotes' }" @click="guiaPrincipal = 'lotes'">
          🏷️ Lotes
        </button>
        <button class="guia-btn" :class="{ active: guiaPrincipal === 'animais' }" @click="guiaPrincipal = 'animais'">
          🐄 Animais
        </button>
        <button class="guia-btn" :class="{ active: guiaPrincipal === 'vendas' }" @click="abrirVendas">
          💰 Vendas
        </button>
      </div>

      <!-- Ações contextuais -->
      <div class="header-actions" v-if="guiaPrincipal === 'lotes'">
        <div class="visao-toggle">
          <q-btn flat dense round icon="grid_view" :color="visao === 'grade' ? 'primary' : 'grey-5'" @click="visao = 'grade'">
            <q-tooltip>Vista em grade</q-tooltip>
          </q-btn>
          <q-btn flat dense round icon="view_sidebar" :color="visao === 'individual' ? 'primary' : 'grey-5'" @click="mudarParaIndividual">
            <q-tooltip>Vista individual</q-tooltip>
          </q-btn>
        </div>
        <q-btn color="primary" icon="add" label="NOVO LOTE" @click="abrirForm = true" unelevated />
      </div>
    </div>

    <!-- Subtítulo contextual -->
    <div class="guia-subtitle q-mb-md" v-if="guiaPrincipal === 'lotes'">
      {{ lotesStore.lotesAtivos.length }} lotes ativos
    </div>

    <!-- ── CONTEÚDO: LOTES ────────────────────────────────────────── -->
    <template v-if="guiaPrincipal === 'lotes'">

    <!-- Barra de filtros unificada -->
    <div class="filtros-bar q-mb-md">
      <!-- Grupo espécie -->
      <template v-if="especiesNosLotes.length > 1">
        <button class="f-chip" :class="{ active: especieFiltro === '' }" @click="especieFiltro = ''">Todos</button>
        <button
          v-for="e in especiesNosLotes" :key="e.valor"
          class="f-chip" :class="{ active: especieFiltro === e.valor }"
          @click="especieFiltro = e.valor"
        >{{ e.emoji }} {{ e.label }}</button>
        <span v-if="finalidadesNosLotes.length > 1" class="f-divider" />
      </template>

      <!-- Grupo finalidade -->
      <template v-if="finalidadesNosLotes.length > 1">
        <button class="f-chip" :class="{ active: finalidadeFiltro === '' }" @click="finalidadeFiltro = ''">Todas</button>
        <button
          v-for="f in finalidadesNosLotes" :key="f.valor"
          class="f-chip f-chip--fin"
          :class="{ active: finalidadeFiltro === f.valor }"
          :style="finalidadeFiltro === f.valor
            ? { background: FINALIDADE_META[f.valor]?.bg, color: FINALIDADE_META[f.valor]?.txt, borderColor: FINALIDADE_META[f.valor]?.txt }
            : {}"
          @click="finalidadeFiltro = f.valor"
        >{{ f.icone }} {{ f.label }}</button>
      </template>
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
      <template v-if="visao === 'grade'">
        <div v-for="grupo in lotesPorFinalidade" :key="grupo.finalidade" class="grupo-section">
          <!-- Cabeçalho do grupo -->
          <div class="grupo-header">
            <span class="grupo-icon">{{ grupo.icone }}</span>
            <span class="grupo-titulo">{{ grupo.label }}</span>
            <span class="grupo-count">{{ grupo.lotes.length }} lote{{ grupo.lotes.length !== 1 ? 's' : '' }}</span>
            <div class="grupo-linha" />
          </div>

          <div class="lotes-grid">
            <div v-for="lote in grupo.lotes" :key="lote.id" class="lote-card">
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
                <q-chip v-if="lote.finalidade" dense size="sm"
                  :style="`background:${finalidadeColor(lote.finalidade).bg};color:${finalidadeColor(lote.finalidade).txt}`"
                  class="q-ma-none" style="font-size:.65rem;text-transform:uppercase">
                  {{ finalidades.find(f => f.value === lote.finalidade)?.label ?? lote.finalidade.toUpperCase() }}
                </q-chip>
                <q-chip dense size="sm" :color="faseColor(lote.fase)" text-color="white" class="q-ma-none q-ml-xs" style="text-transform:uppercase;font-size:.65rem">
                  {{ fases.find(f => f.value === lote.fase)?.label ?? (lote.fase ?? 'SEM FASE').toUpperCase() }}
                </q-chip>
                <q-chip v-if="lote.localizacao" dense size="sm" class="q-ma-none q-ml-xs bg-grey-2 text-grey-8" style="text-transform:uppercase;font-size:.65rem">
                  {{ lote.localizacao }}
                </q-chip>
              </div>
            </div>
          </div>
        </div>
      </template>

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
            <div class="li-chips">
              <q-chip v-if="lote.finalidade" dense size="xs"
                :style="`background:${finalidadeColor(lote.finalidade).bg};color:${finalidadeColor(lote.finalidade).txt}`"
                class="q-ma-none"
                style="font-size:.58rem;text-transform:uppercase"
              >{{ finalidades.find(f => f.value === lote.finalidade)?.label?.slice(0,3) ?? '—' }}</q-chip>
              <q-chip
                dense size="xs"
                :color="faseColor(lote.fase)"
                text-color="white"
                class="q-ma-none"
                style="font-size:.58rem;text-transform:uppercase"
              >{{ fases.find(f => f.value === lote.fase)?.label?.slice(0,4) ?? '—' }}</q-chip>
            </div>
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
            <div v-if="loteSelecionado.observacao" class="detalhe-obs q-mb-md">
              <div class="obs-label">OBSERVAÇÃO</div>
              <div class="obs-texto">{{ loteSelecionado.observacao }}</div>
            </div>

            <q-separator class="q-mb-md" />

            <!-- Animais do lote -->
            <div class="animais-section-header">
              <div class="detalhe-kpi-titulo">ANIMAIS DO LOTE</div>
              <q-btn
                flat dense no-caps size="sm"
                icon="add" label="Adicionar Animal"
                color="primary"
                @click="abrirDialogAnimal"
              />
            </div>

            <div v-if="animaisCarregando" class="q-py-md text-center">
              <q-spinner color="primary" size="sm" />
            </div>

            <div v-else-if="!animaisDoLote.length" class="animais-empty">
              <div style="font-size:1.8rem">🐄</div>
              <div>Nenhum animal cadastrado neste lote</div>
              <q-btn flat no-caps size="sm" label="Adicionar primeiro animal" color="primary" @click="abrirDialogAnimal" class="q-mt-xs" />
            </div>

            <div v-else class="animais-mini-list">
              <div v-for="a in animaisDoLote" :key="a.id" class="ami-item">
                <div class="ami-sexo">{{ a.sexo === 'femea' ? '♀' : a.sexo === 'macho' ? '♂' : '·' }}</div>
                <div class="ami-body">
                  <div class="ami-nome">{{ a.brinco ? '#' + a.brinco : 'Sem brinco' }}</div>
                  <div class="ami-sub">
                    <span v-if="a.raca">{{ a.raca }}</span>
                    <span v-if="a.dataNascimento"> · {{ formatarData(a.dataNascimento) }}</span>
                    <span v-if="a.origem"> · {{ a.origem === 'nascido' ? 'Nascido' : 'Comprado' }}</span>
                  </div>
                </div>
                <div class="ami-right">
                  <div v-if="a.pesoEntrada" class="ami-peso">{{ Number(a.pesoEntrada).toFixed(1) }} kg</div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- Dialog: Adicionar Animal ao lote -->
    <q-dialog v-model="dialogAnimal" :maximized="$q.screen.xs">
      <q-card class="form-card">
        <q-card-section class="row items-center bg-primary text-white q-py-sm">
          <q-icon name="pets" size="sm" class="q-mr-sm" />
          <div class="text-h6">Adicionar Animal — {{ loteSelecionado?.nome }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md scroll" style="max-height:70vh">
          <q-form @submit="registrarAnimal" class="q-gutter-sm">
            <div class="row q-gutter-sm">
              <q-input v-model="formAnimal.brinco" label="BRINCO / IDENTIFICAÇÃO" outlined dense class="col" />
              <q-select
                v-model="formAnimal.sexo"
                label="SEXO"
                :options="[{ label: 'MACHO', value: 'macho' }, { label: 'FÊMEA', value: 'femea' }]"
                emit-value map-options
                outlined dense clearable class="col"
              />
            </div>

            <q-input v-model="formAnimal.raca" label="RAÇA" outlined dense />

            <div class="row q-gutter-sm">
              <q-input
                v-model.number="formAnimal.pesoEntrada"
                type="number" step="0.1"
                label="PESO ENTRADA (KG)"
                outlined dense class="col"
              />
              <q-input
                v-model="formAnimal.dataNascimento"
                type="date" label="NASCIMENTO"
                outlined dense class="col"
              />
            </div>

            <div class="row q-gutter-sm">
              <q-select
                v-model="formAnimal.origem"
                label="ORIGEM"
                :options="[{ label: 'COMPRADO', value: 'comprado' }, { label: 'NASCIDO', value: 'nascido' }]"
                emit-value map-options
                outlined dense class="col"
              />
              <q-input
                v-model.number="formAnimal.valorCompra"
                type="number" step="0.01"
                label="VALOR COMPRA (R$)"
                outlined dense class="col"
              />
            </div>

            <q-input v-model="formAnimal.observacao" label="OBSERVAÇÃO" outlined dense />

            <div class="row q-gutter-sm q-mt-sm">
              <q-btn
                outline color="primary" label="Registrar e adicionar outro"
                no-caps class="col"
                :loading="salvandoAnimal"
                @click="registrarAnimal(true)"
              />
              <q-btn
                type="submit" color="primary" label="Registrar"
                icon="check" unelevated no-caps class="col"
                :loading="salvandoAnimal"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

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
              <q-input v-model.number="novoLote.qtdInicial" type="number" label="Quantidade *" outlined dense class="col" :rules="[v => v > 0 || 'Obrigatório']" />
              <q-input v-model.number="novoLote.pesoMedioEntrada" type="number" label="Peso (kg)" outlined dense class="col" />
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

    </template>
    <!-- ── FIM CONTEÚDO: LOTES ───────────────────────────────────── -->

    <!-- ── CONTEÚDO: ANIMAIS ─────────────────────────────────────── -->
    <AnimaisPage v-if="guiaPrincipal === 'animais'" />

    <!-- ── CONTEÚDO: VENDAS ──────────────────────────────────────── -->
    <template v-if="guiaPrincipal === 'vendas'">
      <!-- Cabeçalho + botão vender -->
      <div class="venda-header q-mb-md">
        <div>
          <div class="venda-title">Venda de animais</div>
          <div class="venda-sub">Selecione os animais, ajuste o preço e confirme</div>
        </div>
        <div class="venda-header-actions">
          <q-btn flat dense round icon="refresh" @click="carregarVendas" :loading="vendasCarregando" />
          <q-btn
            color="positive" icon="sell"
            :label="vendaSelecionados.size ? `Vender (${vendaSelecionados.size}) · R$ ${totalVenda.toFixed(2)}` : 'Vender selecionados'"
            unelevated no-caps
            :disable="!vendaSelecionados.size"
            :loading="confirmandoVenda"
            @click="confirmarVenda"
          />
        </div>
      </div>

      <!-- Filtros: lote + peso + preço -->
      <div class="venda-filtros-area q-mb-md">
        <!-- Lotes -->
        <div class="vf-chips">
          <button class="filtro-chip" :class="{ active: vendaFiltroLote === null }" @click="vendaFiltroLote = null">Todos</button>
          <button
            v-for="l in lotesStore.lotesAtivos" :key="l.id"
            class="filtro-chip" :class="{ active: vendaFiltroLote === l.id }"
            @click="vendaFiltroLote = l.id"
          >{{ getEmoji(l.especie) }} {{ l.nome }}</button>
        </div>
        <!-- Peso e preço -->
        <div class="vf-ranges">
          <div class="vf-range-group">
            <span class="vf-range-label">Peso (kg)</span>
            <input class="vf-range-input" type="number" placeholder="Mín" v-model.number="vendaFiltroPesoMin" step="1" min="0" />
            <span class="vf-range-sep">—</span>
            <input class="vf-range-input" type="number" placeholder="Máx" v-model.number="vendaFiltroPesoMax" step="1" min="0" />
          </div>
          <div class="vf-range-group">
            <span class="vf-range-label">Preço (R$)</span>
            <input class="vf-range-input" type="number" placeholder="Mín" v-model.number="vendaFiltroPrecoMin" step="10" min="0" />
            <span class="vf-range-sep">—</span>
            <input class="vf-range-input" type="number" placeholder="Máx" v-model.number="vendaFiltroPrecoMax" step="10" min="0" />
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-if="vendasCarregando" class="q-py-xl text-center"><q-spinner color="primary" size="lg"/></div>
      <div v-else-if="!animaisVendaFiltrados.length" class="venda-empty">
        <div style="font-size:2.5rem">🐄</div>
        <div>Nenhum animal encontrado com esses filtros</div>
      </div>

      <template v-else>
        <div class="venda-table">
          <div class="vt-head">
            <div class="vt-col-check">
              <q-checkbox :model-value="todosSelecionados" @update:model-value="toggleTodos" color="primary" dense />
            </div>
            <div class="vt-col-id">Animal</div>
            <div class="vt-col-lote">Lote</div>
            <div class="vt-col-peso">Peso</div>
            <div class="vt-col-idade">Idade</div>
            <div class="vt-col-preco">Preço</div>
          </div>

          <div
            v-for="a in animaisVendaFiltrados" :key="a.id"
            class="vt-row"
            :class="{ selected: vendaSelecionados.has(a.id) }"
            @click="toggleAnimal(a.id)"
          >
            <div class="vt-col-check" @click.stop>
              <q-checkbox :model-value="vendaSelecionados.has(a.id)" @update:model-value="toggleAnimal(a.id)" color="primary" dense />
            </div>
            <div class="vt-col-id">
              <div class="vt-brinco">{{ a.brinco ? '#' + a.brinco : '—' }}</div>
              <div class="vt-raca">{{ a.raca ?? 'Raça n/i' }} · {{ a.sexo === 'macho' ? '♂' : a.sexo === 'femea' ? '♀' : '—' }}</div>
            </div>
            <div class="vt-col-lote">
              <span class="vt-lote-nome">{{ getEmoji(a.lote?.especie ?? '') }} {{ a.lote?.nome }}</span>
            </div>
            <div class="vt-col-peso">
              <span class="vt-peso">{{ a.pesoEntrada ? a.pesoEntrada.toFixed(1) + ' kg' : '—' }}</span>
            </div>
            <div class="vt-col-idade">{{ calcularIdade(a.dataNascimento) }}</div>
            <div class="vt-col-preco" @click.stop>
              <div class="preco-wrapper">
                <span class="preco-rs">R$</span>
                <input
                  class="preco-input"
                  type="number" step="0.01"
                  :value="vendaPrecos[a.id] ?? precoSugerido(a)"
                  @input="vendaPrecos[a.id] = Number(($event.target as HTMLInputElement).value)"
                  @focus="vendaSelecionados.add(a.id)"
                />
              </div>
              <div class="preco-base">Sugerido: R$ {{ precoSugerido(a).toFixed(2) }} · {{ precoKgLabel(a) }}/kg</div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useLotesStore } from 'src/stores/lotes.store'
import { useAuthStore } from 'src/stores/auth.store'
import { useEspecies, ESPECIES } from 'src/composables/useEspecies'
import AnimaisPage from './AnimaisPage.vue'

const $q = useQuasar()
const lotesStore = useLotesStore()
const authStore = useAuthStore()
const { getEmoji, getLabel } = useEspecies()

const guiaPrincipal = ref<'lotes' | 'animais' | 'vendas'>('lotes')
const visao = ref<'grade' | 'individual'>('grade')
const especieFiltro    = ref('')
const finalidadeFiltro = ref('')
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

const animaisDoLote = ref<any[]>([])
const animaisCarregando = ref(false)
const dialogAnimal = ref(false)
const salvandoAnimal = ref(false)
const formAnimal = ref({
  brinco: '', raca: '', sexo: null as 'macho' | 'femea' | null,
  dataNascimento: '', origem: 'comprado' as 'comprado' | 'nascido',
  pesoEntrada: null as number | null,
  valorCompra: null as number | null,
  observacao: '',
})

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

const FINALIDADE_META: Record<string, { label: string; icone: string; bg: string; txt: string }> = {
  corte:        { label: 'Corte',        icone: '🥩', bg: '#fdecea', txt: '#b71c1c' },
  leite:        { label: 'Leite',        icone: '🥛', bg: '#e3f2fd', txt: '#0d47a1' },
  reproducao:   { label: 'Reprodução',   icone: '🐣', bg: '#f3e5f5', txt: '#6a1b9a' },
  postura:      { label: 'Postura',      icone: '🥚', bg: '#fff8e1', txt: '#e65100' },
  esporte:      { label: 'Esporte',      icone: '🏆', bg: '#e8eaf6', txt: '#1a237e' },
  trabalho:     { label: 'Trabalho',     icone: '💪', bg: '#efebe9', txt: '#3e2723' },
  piscicultura: { label: 'Piscicultura', icone: '🐟', bg: '#e0f7fa', txt: '#006064' },
  alevinagem:   { label: 'Alevinagem',   icone: '🐠', bg: '#e0f2f1', txt: '#004d40' },
}

function finalidadeColor(finalidade?: string) {
  return FINALIDADE_META[finalidade ?? ''] ?? { bg: '#f5f5f5', txt: '#616161' }
}

const especiesNosLotes = computed(() => {
  const unicas = [...new Set(lotesStore.lotesAtivos.map(l => l.especie))]
  return unicas.map(e => ({ valor: e, emoji: getEmoji(e), label: getLabel(e) }))
})

const finalidadesNosLotes = computed(() => {
  const ordem = ['corte', 'leite', 'reproducao', 'postura', 'esporte', 'trabalho', 'piscicultura', 'alevinagem']
  const unicas = [...new Set(lotesStore.lotesAtivos.map(l => l.finalidade).filter(Boolean))]
  return ordem
    .filter(f => unicas.includes(f))
    .map(f => ({
      valor: f,
      icone: FINALIDADE_META[f]?.icone ?? '📦',
      label: FINALIDADE_META[f]?.label ?? f,
    }))
})

const lotesFiltrados = computed(() => {
  let lista = lotesStore.lotesAtivos
  if (especieFiltro.value)    lista = lista.filter(l => l.especie    === especieFiltro.value)
  if (finalidadeFiltro.value) lista = lista.filter(l => l.finalidade === finalidadeFiltro.value)
  return lista
})

const lotesPorFinalidade = computed(() => {
  const lista = lotesFiltrados.value
  const map = new Map<string, any[]>()

  for (const lote of lista) {
    const key = lote.finalidade ?? 'sem_finalidade'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(lote)
  }

  const ordem = ['corte', 'leite', 'reproducao', 'postura', 'esporte', 'trabalho', 'piscicultura', 'alevinagem', 'sem_finalidade']
  const grupos: { finalidade: string; label: string; icone: string; lotes: any[] }[] = []

  for (const key of ordem) {
    if (!map.has(key)) continue
    const meta = FINALIDADE_META[key]
    grupos.push({
      finalidade: key,
      label: meta?.label ?? 'Sem finalidade',
      icone: meta?.icone ?? '📦',
      lotes: map.get(key)!,
    })
  }

  return grupos
})

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
  await Promise.all([carregarKPIIndividual(), carregarAnimaisDoLote()])
}

async function carregarAnimaisDoLote() {
  if (!loteSelecionado.value) return
  animaisCarregando.value = true
  try {
    animaisDoLote.value = await api.get(`/animais?loteId=${loteSelecionado.value.id}`).then(r => r.data)
  } finally {
    animaisCarregando.value = false
  }
}

function abrirDialogAnimal() {
  formAnimal.value = {
    brinco: '', raca: '', sexo: null, dataNascimento: '',
    origem: 'comprado', pesoEntrada: null, valorCompra: null, observacao: '',
  }
  dialogAnimal.value = true
}

async function registrarAnimal(manterAberto = false) {
  if (!loteSelecionado.value) return
  salvandoAnimal.value = true
  try {
    const payload: any = { loteId: loteSelecionado.value.id }
    if (formAnimal.value.brinco)         payload.brinco         = formAnimal.value.brinco
    if (formAnimal.value.raca)           payload.raca           = formAnimal.value.raca
    if (formAnimal.value.sexo)           payload.sexo           = formAnimal.value.sexo
    if (formAnimal.value.dataNascimento) payload.dataNascimento = formAnimal.value.dataNascimento
    if (formAnimal.value.origem)         payload.origem         = formAnimal.value.origem
    if (formAnimal.value.pesoEntrada)    payload.pesoEntrada    = formAnimal.value.pesoEntrada
    if (formAnimal.value.valorCompra)    payload.valorCompra    = formAnimal.value.valorCompra
    if (formAnimal.value.observacao)     payload.observacao     = formAnimal.value.observacao

    await api.post('/animais', payload)
    $q.notify({ type: 'positive', message: 'Animal registrado!' })

    await Promise.all([carregarAnimaisDoLote(), lotesStore.carregar()])
    loteSelecionado.value = lotesStore.lotesAtivos.find(l => l.id === loteSelecionado.value?.id) ?? loteSelecionado.value

    if (manterAberto) {
      formAnimal.value = {
        brinco: '', raca: '', sexo: null, dataNascimento: '',
        origem: 'comprado', pesoEntrada: null, valorCompra: null, observacao: '',
      }
    } else {
      dialogAnimal.value = false
    }
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao registrar animal' })
  } finally {
    salvandoAnimal.value = false
  }
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

// ── VENDAS ────────────────────────────────────────────────────────
const animaisVenda      = ref<any[]>([])
const vendasCarregando  = ref(false)
const confirmandoVenda  = ref(false)
const vendaSelecionados = ref(new Set<number>())
const vendaPrecos       = ref<Record<number, number>>({})
const vendaFiltroLote    = ref<number | null>(null)
const vendaFiltroPesoMin = ref<number | null>(null)
const vendaFiltroPesoMax = ref<number | null>(null)
const vendaFiltroPrecoMin = ref<number | null>(null)
const vendaFiltroPrecoMax = ref<number | null>(null)

const PRECO_KG: Record<string, number> = {
  bovino_corte: 12.5, bovino_leite: 8.0, bovino_reproducao: 15.0,
  suino_corte: 8.5,
  ovino_corte: 18.0, caprino_corte: 16.0,
  equino_esporte: 25.0, equino_trabalho: 18.0,
  avicultura_corte: 6.5, avicultura_postura: 5.0,
  piscicultura_piscicultura: 12.0,
}

function precoKg(animal: any) {
  const e = animal.lote?.especie ?? ''
  const f = animal.lote?.finalidade ?? ''
  return PRECO_KG[`${e}_${f}`] ?? PRECO_KG[e] ?? 10.0
}
function precoSugerido(animal: any) {
  return (animal.pesoEntrada ?? 0) * precoKg(animal)
}
function precoKgLabel(animal: any) {
  return `R$ ${precoKg(animal).toFixed(2)}`
}
function calcularIdade(dataNascimento?: string) {
  if (!dataNascimento) return '—'
  const dias = Math.floor((Date.now() - new Date(dataNascimento).getTime()) / 86400000)
  if (dias < 30)  return `${dias}d`
  if (dias < 365) return `${Math.floor(dias / 30)}m`
  return `${(dias / 365).toFixed(1)}a`
}

const animaisVendaFiltrados = computed(() =>
  animaisVenda.value.filter(a => {
    if (vendaFiltroLote.value && a.loteId !== vendaFiltroLote.value) return false
    const peso = a.pesoEntrada ?? 0
    if (vendaFiltroPesoMin.value != null && peso < vendaFiltroPesoMin.value) return false
    if (vendaFiltroPesoMax.value != null && peso > vendaFiltroPesoMax.value) return false
    const preco = vendaPrecos.value[a.id] ?? precoSugerido(a)
    if (vendaFiltroPrecoMin.value != null && preco < vendaFiltroPrecoMin.value) return false
    if (vendaFiltroPrecoMax.value != null && preco > vendaFiltroPrecoMax.value) return false
    return true
  })
)

const todosSelecionados = computed(() =>
  animaisVendaFiltrados.value.length > 0 &&
  animaisVendaFiltrados.value.every(a => vendaSelecionados.value.has(a.id))
)

const totalVenda = computed(() => {
  let total = 0
  for (const id of vendaSelecionados.value) {
    const a = animaisVenda.value.find(x => x.id === id)
    if (a) total += vendaPrecos.value[id] ?? precoSugerido(a)
  }
  return total
})

function toggleAnimal(id: number) {
  const s = new Set(vendaSelecionados.value)
  s.has(id) ? s.delete(id) : s.add(id)
  vendaSelecionados.value = s
}

function toggleTodos(val: boolean) {
  if (val) {
    vendaSelecionados.value = new Set(animaisVendaFiltrados.value.map(a => a.id))
  } else {
    vendaSelecionados.value = new Set()
  }
}

async function carregarVendas() {
  vendasCarregando.value = true
  try {
    animaisVenda.value = await api.get('/animais?status=ativo').then(r => r.data)
    vendaSelecionados.value = new Set()
    vendaPrecos.value = {}
  } finally {
    vendasCarregando.value = false
  }
}

async function abrirVendas() {
  guiaPrincipal.value = 'vendas'
  if (!animaisVenda.value.length) await carregarVendas()
}

async function confirmarVenda() {
  if (!vendaSelecionados.value.size) return
  confirmandoVenda.value = true
  try {
    await Promise.all(
      [...vendaSelecionados.value].map(id =>
        api.patch(`/animais/${id}/status`, { status: 'vendido' })
      )
    )
    const qtd = vendaSelecionados.value.size
    $q.notify({ type: 'positive', message: `${qtd} animal${qtd > 1 ? 'is vendidos' : ' vendido'} com sucesso!` })
    await carregarVendas()
    await lotesStore.carregar()
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao registrar venda' })
  } finally {
    confirmandoVenda.value = false
  }
}

onMounted(() => lotesStore.carregar())
</script>

<style scoped>
/* ── Guias principais ────────────────────────────────────────────── */
.guias-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 12px;
}

.guias-tabs {
  display: flex;
  background: #f0f0f0;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.guia-btn {
  padding: 9px 20px;
  border: none;
  border-radius: 9px;
  font-size: .85rem;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
  color: #888;
  transition: all .2s;
  white-space: nowrap;
}
.guia-btn.active {
  background: white;
  color: #1b5e20;
  box-shadow: 0 1px 6px rgba(0,0,0,.12);
}

.guia-subtitle {
  font-size: .82rem;
  color: #888;
}

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

/* ── Grupos de finalidade ───────────────────────────────────────── */
.grupo-section { margin-bottom: 28px; }

.grupo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.grupo-icon  { font-size: 1.2rem; }
.grupo-titulo {
  font-size: .82rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: .8px;
  color: #2e7d32;
  white-space: nowrap;
}
.grupo-count {
  font-size: .72rem; color: #aaa; white-space: nowrap;
}
.grupo-linha {
  flex: 1; height: 1px; background: #e8f5e9; min-width: 20px;
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
.li-chips { display: flex; flex-direction: column; gap: 3px; flex-shrink: 0; align-items: flex-end; }

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

/* ── Barra de filtros unificada ──────────────────────────────────── */
.filtros-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.filtros-bar::-webkit-scrollbar { display: none; }

.f-chip {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid #e0e0e0;
  background: white;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
  color: #555;
  line-height: 1.2;
}
.f-chip:hover  { border-color: #a5d6a7; color: #2e7d32; }
.f-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

.f-chip--fin.active { /* cores inline via :style */ }

.f-divider {
  flex-shrink: 0;
  width: 1px;
  height: 22px;
  background: #ddd;
  margin: 0 4px;
}

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

/* ── Animais do lote ─────────────────────────────────────────────── */
.animais-section-header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 12px;
}

.animais-empty {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  padding: 24px; background: #f9fbe7;
  border-radius: 12px; text-align: center;
  color: #aaa; font-size: .85rem;
}

.animais-mini-list { display: flex; flex-direction: column; gap: 6px; }

.ami-item {
  display: flex; align-items: center; gap: 10px;
  background: #fafafa; border-radius: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(0,0,0,.05);
  transition: background .15s;
}
.ami-item:hover { background: #f1f8e9; }

.ami-sexo {
  font-size: 1.2rem; color: #558b2f;
  width: 22px; text-align: center; flex-shrink: 0;
}
.ami-body  { flex: 1; min-width: 0; }
.ami-nome  { font-weight: 600; font-size: .88rem; color: #1b5e20; }
.ami-sub   { font-size: .7rem; color: #aaa; margin-top: 1px; }
.ami-right { text-align: right; flex-shrink: 0; }
.ami-peso  { font-weight: 700; font-size: .95rem; color: #2e7d32; }

/* ── Vendas ──────────────────────────────────────────────────────── */
.venda-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.venda-title  { font-size: 1.3rem; font-weight: 700; color: #1b5e20; }
.venda-sub    { font-size: .82rem; color: #888; margin-top: 2px; }
.venda-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* Filtros */
.venda-filtros-area { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.vf-chips { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
.filtro-chip {
  padding: 5px 14px; border-radius: 20px; border: 1px solid #ddd;
  background: white; font-size: .78rem; cursor: pointer; transition: all .15s;
}
.filtro-chip:hover  { border-color: #81c784; }
.filtro-chip.active { background: #2e7d32; color: white; border-color: #2e7d32; }

.vf-ranges { display: flex; flex-wrap: wrap; gap: 10px; }
.vf-range-group {
  display: flex; align-items: center; gap: 5px;
  background: white; border: 1px solid #e0e0e0; border-radius: 10px;
  padding: 5px 10px;
}
.vf-range-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #888; white-space: nowrap; }
.vf-range-input {
  width: 64px; border: none; outline: none; background: transparent;
  font-size: .82rem; color: #333; text-align: center;
}
.vf-range-sep { color: #ccc; font-size: .8rem; }

.venda-empty { text-align: center; padding: 60px 20px; color: #aaa; font-size: .9rem; }

/* Tabela */
.venda-table {
  background: white; border-radius: 14px; overflow: hidden;
  box-shadow: 0 1px 8px rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.04);
  margin-bottom: 80px;
}
.vt-head {
  display: grid;
  grid-template-columns: 36px 2fr 1.5fr 100px 80px 180px;
  padding: 10px 16px;
  background: #f9fbe7; border-bottom: 1px solid #e8f5e9;
  font-size: .65rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #558b2f;
}
.vt-row {
  display: grid;
  grid-template-columns: 36px 2fr 1.5fr 100px 80px 180px;
  padding: 12px 16px; border-bottom: 1px solid #f5f5f5;
  align-items: center; cursor: pointer; transition: background .1s;
}
.vt-row:hover        { background: #fafafa; }
.vt-row:last-child   { border-bottom: none; }
.vt-row.selected     { background: #f1f8e9; }

.vt-brinco  { font-weight: 700; font-size: .92rem; color: #1b5e20; }
.vt-raca    { font-size: .72rem; color: #aaa; margin-top: 2px; }
.vt-lote-nome { font-size: .82rem; font-weight: 500; }
.vt-peso    { font-weight: 600; color: #333; }

.preco-wrapper {
  display: flex; align-items: center; gap: 4px;
  background: #f9fbe7; border: 1.5px solid #c5e1a5;
  border-radius: 8px; padding: 4px 8px;
}
.preco-rs { font-size: .8rem; color: #558b2f; font-weight: 700; }
.preco-input {
  width: 80px; border: none; background: transparent;
  font-size: .95rem; font-weight: 700; color: #1b5e20;
  outline: none; text-align: right;
}
.preco-base { font-size: .65rem; color: #aaa; margin-top: 3px; }

/* Barra de confirmação */
.venda-bar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
  background: #1b5e20; color: white;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; box-shadow: 0 -4px 20px rgba(0,0,0,.2);
}
.venda-bar-info { display: flex; align-items: center; gap: 10px; font-size: .95rem; }
.vb-count { font-weight: 700; }
.vb-sep   { opacity: .5; }
.vb-total strong { font-size: 1.1rem; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform .25s ease, opacity .25s; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
