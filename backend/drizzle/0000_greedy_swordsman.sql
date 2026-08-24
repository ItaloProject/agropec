CREATE TABLE `animais` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lote_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`brinco` text,
	`raca` text,
	`sexo` text,
	`data_nascimento` text,
	`origem` text DEFAULT 'comprado',
	`valor_compra` real,
	`peso_entrada` real,
	`status` text DEFAULT 'ativo' NOT NULL,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lote_id`) REFERENCES `lotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `compras` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`insumo_id` integer NOT NULL,
	`fornecedor_id` integer,
	`data` text NOT NULL,
	`quantidade` real NOT NULL,
	`valor_unitario` real NOT NULL,
	`valor_total` real NOT NULL,
	`nota_fiscal` text,
	`movimentacao_estoque_id` integer,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fornecedor_id`) REFERENCES `fornecedores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dietas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lote_id` integer NOT NULL,
	`insumo_id` integer NOT NULL,
	`turno` text NOT NULL,
	`qtd_kg_por_cabeca` real NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lote_id`) REFERENCES `lotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `estoque` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`insumo_id` integer NOT NULL,
	`qtd_atual` real DEFAULT 0 NOT NULL,
	`qtd_minima_alerta` real DEFAULT 0 NOT NULL,
	`atualizado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `eventos_saude` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lote_id` integer,
	`animal_id` integer,
	`usuario_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`data` text NOT NULL,
	`produto` text,
	`dose_qtd` real,
	`unidade_dose` text,
	`custo` real,
	`causa_mortis` text,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lote_id`) REFERENCES `lotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`animal_id`) REFERENCES `animais`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fornecedores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`nome` text NOT NULL,
	`telefone` text,
	`email` text,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insumos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`unidade` text DEFAULT 'kg' NOT NULL,
	`proteina_bruta_pct` real,
	`energia_metab` real,
	`custo_por_unidade` real,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lotes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`nome` text NOT NULL,
	`codigo` text,
	`especie` text NOT NULL,
	`finalidade` text,
	`fase` text,
	`localizacao` text,
	`qtd_inicial` integer NOT NULL,
	`data_entrada` text NOT NULL,
	`peso_medio_entrada` real,
	`ativo` integer DEFAULT true NOT NULL,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	`qtd_atual` integer NOT NULL,
	`peso_medio_atual` real,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `movimentacoes_estoque` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`estoque_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`quantidade` real NOT NULL,
	`qtd_antes` real NOT NULL,
	`qtd_depois` real NOT NULL,
	`referencia_id` integer,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`estoque_id`) REFERENCES `estoque`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pesagens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lote_id` integer,
	`animal_id` integer,
	`usuario_id` integer NOT NULL,
	`data` text NOT NULL,
	`peso_kg` real NOT NULL,
	`qtd_pesada` integer,
	`gmd_g_dia` real,
	`variacao_pct` real,
	`dias_desde_ultima_pesagem` integer,
	`responsavel` text,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lote_id`) REFERENCES `lotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`animal_id`) REFERENCES `animais`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `registros_alimentacao` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lote_id` integer NOT NULL,
	`insumo_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`data` text NOT NULL,
	`turno` text NOT NULL,
	`qtd_kg_total` real NOT NULL,
	`qtd_kg_por_cabeca` real NOT NULL,
	`qtd_animais` integer NOT NULL,
	`custo_total` real,
	`movimentacao_estoque_id` integer,
	`observacao` text,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`lote_id`) REFERENCES `lotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`nome_propriedade` text,
	`especies` text DEFAULT '[]' NOT NULL,
	`criado_em` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);