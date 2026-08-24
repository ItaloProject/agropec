import { sql } from 'drizzle-orm'
import {
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

// ─── Enums (stored as text in SQLite) ────────────────────────────────────────

export type Especie = 'bovino' | 'peixe' | 'suino' | 'ave' | 'ovino' | 'equino'
export type Finalidade = 'corte' | 'leite' | 'reproducao' | 'postura' | 'esporte' | 'trabalho'
export type FaseLote = 'cria' | 'recria' | 'engorda' | 'terminacao' | 'maternidade' | 'creche' | 'producao'
export type StatusAnimal = 'ativo' | 'vendido' | 'morto' | 'quarentena'
export type TipoInsumo = 'racao' | 'concentrado' | 'volumoso' | 'suplemento' | 'medicamento' | 'outro'
export type TipoEventoSaude = 'vacina' | 'medicacao' | 'morte' | 'quarentena' | 'exame' | 'parto'
export type Turno = 'manha' | 'tarde' | 'noite'
export type MovimentacaoTipo = 'entrada_compra' | 'saida_alimentacao' | 'saida_manual' | 'ajuste'

// ─── usuarios ─────────────────────────────────────────────────────────────────

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  nomePropriedade: text('nome_propriedade'),
  especies: text('especies', { mode: 'json' }).$type<Especie[]>().notNull().default(sql`'[]'`),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── fornecedores ─────────────────────────────────────────────────────────────

export const fornecedores = sqliteTable('fornecedores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  email: text('email'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── insumos (catálogo de rações, medicamentos, suplementos) ──────────────────

export const insumos = sqliteTable('insumos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  nome: text('nome').notNull(),
  tipo: text('tipo').$type<TipoInsumo>().notNull(),
  unidade: text('unidade').notNull().default('kg'),
  proteínaBrutaPct: real('proteina_bruta_pct'),
  energiaMetab: real('energia_metab'),
  custoPorUnidade: real('custo_por_unidade'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── estoque ──────────────────────────────────────────────────────────────────

export const estoque = sqliteTable('estoque', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  insumoId: integer('insumo_id').notNull().references(() => insumos.id),
  qtdAtual: real('qtd_atual').notNull().default(0),
  qtdMinimaAlerta: real('qtd_minima_alerta').notNull().default(0),
  atualizadoEm: text('atualizado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── movimentações de estoque (audit log) ─────────────────────────────────────

export const movimentacoesEstoque = sqliteTable('movimentacoes_estoque', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  estoqueId: integer('estoque_id').notNull().references(() => estoque.id),
  tipo: text('tipo').$type<MovimentacaoTipo>().notNull(),
  quantidade: real('quantidade').notNull(),
  qtdAntes: real('qtd_antes').notNull(),
  qtdDepois: real('qtd_depois').notNull(),
  referenciaId: integer('referencia_id'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── lotes ────────────────────────────────────────────────────────────────────

export const lotes = sqliteTable('lotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  nome: text('nome').notNull(),
  codigo: text('codigo'),
  especie: text('especie').$type<Especie>().notNull(),
  finalidade: text('finalidade').$type<Finalidade>(),
  fase: text('fase').$type<FaseLote>(),
  localizacao: text('localizacao'),
  qtdInicial: integer('qtd_inicial').notNull(),
  dataEntrada: text('data_entrada').notNull(),
  pesoMedioEntrada: real('peso_medio_entrada'),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
  qtdAtual: integer('qtd_atual').notNull(),
  pesoMedioAtual: real('peso_medio_atual'),
})

// ─── animais (rastreabilidade individual — bovinos, suínos, equinos) ──────────

export const animais = sqliteTable('animais', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loteId: integer('lote_id').notNull().references(() => lotes.id),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  brinco: text('brinco'),
  raca: text('raca'),
  sexo: text('sexo').$type<'macho' | 'femea'>(),
  dataNascimento: text('data_nascimento'),
  origem: text('origem').$type<'comprado' | 'nascido'>().default('comprado'),
  valorCompra: real('valor_compra'),
  pesoEntrada: real('peso_entrada'),
  status: text('status').$type<StatusAnimal>().notNull().default('ativo'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── pesagens ─────────────────────────────────────────────────────────────────

export const pesagens = sqliteTable('pesagens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loteId: integer('lote_id').references(() => lotes.id),
  animalId: integer('animal_id').references(() => animais.id),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  data: text('data').notNull(),
  pesoKg: real('peso_kg').notNull(),
  qtdPesada: integer('qtd_pesada'),
  gmdGDia: real('gmd_g_dia'),
  variacaoPct: real('variacao_pct'),
  diasDesdeUltimaPesagem: integer('dias_desde_ultima_pesagem'),
  responsavel: text('responsavel'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── dietas (configuração padrão de alimentação por lote) ─────────────────────

export const dietas = sqliteTable('dietas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loteId: integer('lote_id').notNull().references(() => lotes.id),
  insumoId: integer('insumo_id').notNull().references(() => insumos.id),
  turno: text('turno').$type<Turno>().notNull(),
  qtdKgPorCabeca: real('qtd_kg_por_cabeca').notNull(),
  ativo: integer('ativo', { mode: 'boolean' }).notNull().default(true),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── registros de alimentação ─────────────────────────────────────────────────

export const registrosAlimentacao = sqliteTable('registros_alimentacao', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loteId: integer('lote_id').notNull().references(() => lotes.id),
  insumoId: integer('insumo_id').notNull().references(() => insumos.id),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  data: text('data').notNull(),
  turno: text('turno').$type<Turno>().notNull(),
  qtdKgTotal: real('qtd_kg_total').notNull(),
  qtdKgPorCabeca: real('qtd_kg_por_cabeca').notNull(),
  qtdAnimais: integer('qtd_animais').notNull(),
  custoTotal: real('custo_total'),
  movimentacaoEstoqueId: integer('movimentacao_estoque_id'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── compras ──────────────────────────────────────────────────────────────────

export const compras = sqliteTable('compras', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  insumoId: integer('insumo_id').notNull().references(() => insumos.id),
  fornecedorId: integer('fornecedor_id').references(() => fornecedores.id),
  data: text('data').notNull(),
  quantidade: real('quantidade').notNull(),
  valorUnitario: real('valor_unitario').notNull(),
  valorTotal: real('valor_total').notNull(),
  notaFiscal: text('nota_fiscal'),
  movimentacaoEstoqueId: integer('movimentacao_estoque_id'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── eventos de saúde ─────────────────────────────────────────────────────────

export const eventosSaude = sqliteTable('eventos_saude', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loteId: integer('lote_id').references(() => lotes.id),
  animalId: integer('animal_id').references(() => animais.id),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id),
  tipo: text('tipo').$type<TipoEventoSaude>().notNull(),
  data: text('data').notNull(),
  produto: text('produto'),
  doseQtd: real('dose_qtd'),
  unidadeDose: text('unidade_dose'),
  custo: real('custo'),
  causaMortis: text('causa_mortis'),
  observacao: text('observacao'),
  criadoEm: text('criado_em').notNull().default(sql`(datetime('now'))`),
})

// ─── Relations (necessário para db.query.*.findMany({ with: {} })) ────────────

import { relations } from 'drizzle-orm'

export const usuariosRelations = relations(usuarios, ({ many }) => ({
  lotes: many(lotes),
  insumos: many(insumos),
  estoque: many(estoque),
  compras: many(compras),
  fornecedores: many(fornecedores),
}))

export const insumosRelations = relations(insumos, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [insumos.usuarioId], references: [usuarios.id] }),
  estoque: many(estoque),
  registrosAlimentacao: many(registrosAlimentacao),
  dietas: many(dietas),
  compras: many(compras),
}))

export const estoqueRelations = relations(estoque, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [estoque.usuarioId], references: [usuarios.id] }),
  insumo: one(insumos, { fields: [estoque.insumoId], references: [insumos.id] }),
  movimentacoes: many(movimentacoesEstoque),
}))

export const movimentacoesEstoqueRelations = relations(movimentacoesEstoque, ({ one }) => ({
  estoque: one(estoque, { fields: [movimentacoesEstoque.estoqueId], references: [estoque.id] }),
}))

export const fornecedoresRelations = relations(fornecedores, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [fornecedores.usuarioId], references: [usuarios.id] }),
  compras: many(compras),
}))

export const lotesRelations = relations(lotes, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [lotes.usuarioId], references: [usuarios.id] }),
  animais: many(animais),
  pesagens: many(pesagens),
  dietas: many(dietas),
  registrosAlimentacao: many(registrosAlimentacao),
  eventosSaude: many(eventosSaude),
}))

export const animaisRelations = relations(animais, ({ one, many }) => ({
  lote: one(lotes, { fields: [animais.loteId], references: [lotes.id] }),
  usuario: one(usuarios, { fields: [animais.usuarioId], references: [usuarios.id] }),
  pesagens: many(pesagens),
  eventosSaude: many(eventosSaude),
}))

export const pesagensRelations = relations(pesagens, ({ one }) => ({
  lote: one(lotes, { fields: [pesagens.loteId], references: [lotes.id] }),
  animal: one(animais, { fields: [pesagens.animalId], references: [animais.id] }),
  usuario: one(usuarios, { fields: [pesagens.usuarioId], references: [usuarios.id] }),
}))

export const dietasRelations = relations(dietas, ({ one }) => ({
  lote: one(lotes, { fields: [dietas.loteId], references: [lotes.id] }),
  insumo: one(insumos, { fields: [dietas.insumoId], references: [insumos.id] }),
}))

export const registrosAlimentacaoRelations = relations(registrosAlimentacao, ({ one }) => ({
  lote: one(lotes, { fields: [registrosAlimentacao.loteId], references: [lotes.id] }),
  insumo: one(insumos, { fields: [registrosAlimentacao.insumoId], references: [insumos.id] }),
  usuario: one(usuarios, { fields: [registrosAlimentacao.usuarioId], references: [usuarios.id] }),
}))

export const comprasRelations = relations(compras, ({ one }) => ({
  usuario: one(usuarios, { fields: [compras.usuarioId], references: [usuarios.id] }),
  insumo: one(insumos, { fields: [compras.insumoId], references: [insumos.id] }),
  fornecedor: one(fornecedores, { fields: [compras.fornecedorId], references: [fornecedores.id] }),
}))

export const eventosSaudeRelations = relations(eventosSaude, ({ one }) => ({
  lote: one(lotes, { fields: [eventosSaude.loteId], references: [lotes.id] }),
  animal: one(animais, { fields: [eventosSaude.animalId], references: [animais.id] }),
  usuario: one(usuarios, { fields: [eventosSaude.usuarioId], references: [usuarios.id] }),
}))

// ─── Export de tipos inferidos ─────────────────────────────────────────────────

export type Usuario = typeof usuarios.$inferSelect
export type Lote = typeof lotes.$inferSelect
export type Animal = typeof animais.$inferSelect
export type Pesagem = typeof pesagens.$inferSelect
export type Insumo = typeof insumos.$inferSelect
export type Estoque = typeof estoque.$inferSelect
export type Compra = typeof compras.$inferSelect
export type RegistroAlimentacao = typeof registrosAlimentacao.$inferSelect
export type EventoSaude = typeof eventosSaude.$inferSelect
export type Movimentacao = typeof movimentacoesEstoque.$inferSelect
