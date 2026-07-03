import { relations, sql } from "drizzle-orm"
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const tipoAcessoEnum = pgEnum("tipo_acesso", [
  "Colaborador",
  "Supervisor",
  "Gerente",
  "Financeiro",
  "Adm",
])

export const centrosCusto = pgTable("centros_custo", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: text("numero").notNull().unique(),
  nome: text("nome").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const equipes = pgTable("equipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull().unique(),
  supervisorId: uuid("supervisor_id").references(() => colaboradores.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

export const colaboradores = pgTable("colaboradores", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomeCompleto: text("nome_completo").notNull(),
  salario: numeric("salario", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  cnpj: text("cnpj"),
  dataNascimento: date("data_nascimento"),
  email: text("email").unique(),
  // Resquício do Supabase Auth (auth.users) — mantido como UUID solto, sem FK,
  // pois o schema auth.* não existe fora do Supabase e a auth já é 100% customizada.
  userId: uuid("user_id"),
  tipoAcesso: tipoAcessoEnum("tipo_acesso").default("Colaborador"),
  senhaHash: text("senha_hash"),
  equipeId: uuid("equipe_id").references(() => equipes.id, { onDelete: "set null" }),
  historicoReajustes: jsonb("historico_reajustes").default([]),
  diaPagamento: integer("dia_pagamento").default(1),
  chavePix: text("chave_pix"),
  centroCustoId: uuid("centro_custo_id").references(() => centrosCusto.id, { onDelete: "set null" }),
  tipoChavePix: text("tipo_chave_pix"),
  dataAniversarioContrato: date("data_aniversario_contrato"),
}, (table) => [
  check("colaboradores_dia_pagamento_check", sql`${table.diaPagamento} IN (1, 15)`),
])

export const gerentesEquipes = pgTable("gerentes_equipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  gerenteId: uuid("gerente_id").notNull().references(() => colaboradores.id, { onDelete: "cascade" }),
  equipeId: uuid("equipe_id").notNull().references(() => equipes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("gerentes_equipes_gerente_equipe_key").on(table.gerenteId, table.equipeId),
])

export const pedidosPagamento = pgTable("pedidos_pagamento", {
  id: uuid("id").primaryKey().defaultRandom(),
  colaboradorId: uuid("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: "cascade" }),
  horasExtras: numeric("horas_extras", { precision: 12, scale: 2 }).default("0"),
  valorKm: numeric("valor_km", { precision: 12, scale: 2 }).default("0"),
  valorTotal: numeric("valor_total", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  status: text("status").default("pendente_gerente"),
  aprovadoGerente: boolean("aprovado_gerente").default(false),
  aprovadoFinanceiro: boolean("aprovado_financeiro").default(false),
  observacaoGerente: text("observacao_gerente"),
  observacaoFinanceiro: text("observacao_financeiro"),
  dataAprovacaoGerente: timestamp("data_aprovacao_gerente"),
  dataAprovacaoFinanceiro: timestamp("data_aprovacao_financeiro"),
  criadoPorColaboradorId: uuid("criado_por_colaborador_id").references(() => colaboradores.id),
  motivoHorasExtras: text("motivo_horas_extras"),
  valorDesconto: numeric("valor_desconto", { precision: 10, scale: 2 }).default("0"),
  motivoDesconto: text("motivo_desconto"),
  notaEmitida: boolean("nota_emitida").default(false),
  dataEmissaoNota: timestamp("data_emissao_nota", { withTimezone: true }),
  notaFiscalUrl: text("nota_fiscal_url"),
  horasExtras50: numeric("horas_extras_50", { precision: 5, scale: 2 }).default("0"),
  horasExtras100: numeric("horas_extras_100", { precision: 5, scale: 2 }).default("0"),
  conducao: numeric("conducao", { precision: 10, scale: 2 }).default("0"),
  dataPrevisaoPagamento: date("data_previsao_pagamento"),
  tipoPedido: text("tipo_pedido").default("completo"),
  valorPlantao: numeric("valor_plantao", { precision: 10, scale: 2 }).default("0"),
  motivoPlantao: text("motivo_plantao"),
  notaFiscalAnexada: boolean("nota_fiscal_anexada").default(false),
  dataLimiteAnexoNota: timestamp("data_limite_anexo_nota"),
  salarioBase: numeric("salario_base", { precision: 10, scale: 2 }),
  prorrogacaoSolicitada: boolean("prorrogacao_solicitada").default(false),
  motivoProrrogacao: text("motivo_prorrogacao"),
  dataSolicitacaoProrrogacao: timestamp("data_solicitacao_prorrogacao", { withTimezone: true }),
  prorrogacaoAprovada: boolean("prorrogacao_aprovada"),
  observacaoProrrogacao: text("observacao_prorrogacao"),
  correcaoSolicitadaPor: text("correcao_solicitada_por"),
  comissao: numeric("comissao").default("0"),
  motivoComissao: text("motivo_comissao"),
  aprovadoPorGerenteId: uuid("aprovado_por_gerente_id").references(() => colaboradores.id),
  aprovadoPorFinanceiroId: uuid("aprovado_por_financeiro_id").references(() => colaboradores.id),
  dataNotaRecebida: timestamp("data_nota_recebida", { withTimezone: true }),
}, (table) => [
  check(
    "pedidos_pagamento_status_check",
    sql`${table.status} IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao', 'pago', 'aguardando_prorrogacao', 'prorrogacao_negada')`,
  ),
  check("pedidos_pagamento_tipo_pedido_check", sql`${table.tipoPedido} IN ('completo', 'reembolso_km')`),
])

export const historicoReajustes = pgTable("historico_reajustes", {
  id: uuid("id").primaryKey().defaultRandom(),
  colaboradorId: uuid("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: "cascade" }),
  salarioAnterior: numeric("salario_anterior", { precision: 10, scale: 2 }).notNull(),
  salarioNovo: numeric("salario_novo", { precision: 10, scale: 2 }).notNull(),
  tipoReajuste: varchar("tipo_reajuste", { length: 20 }).notNull(),
  valorReajuste: numeric("valor_reajuste", { precision: 10, scale: 2 }).notNull(),
  motivo: text("motivo"),
  aplicadoPor: uuid("aplicado_por").notNull().references(() => colaboradores.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check("historico_reajustes_tipo_check", sql`${table.tipoReajuste} IN ('porcentagem', 'valor')`),
])

export const notasFiscais = pgTable("notas_fiscais", {
  id: uuid("id").primaryKey().defaultRandom(),
  pedidoId: uuid("pedido_id").references(() => pedidosPagamento.id, { onDelete: "cascade" }).unique(),
  colaboradorId: uuid("colaborador_id").references(() => colaboradores.id, { onDelete: "cascade" }),
  numeroNfse: text("numero_nfse").notNull(),
  chaveAcesso: text("chave_acesso"),
  competenciaMes: integer("competencia_mes").notNull(),
  competenciaAno: integer("competencia_ano").notNull(),
  valorServico: numeric("valor_servico", { precision: 10, scale: 2 }).notNull(),
  cpfCnpjPrestador: text("cpf_cnpj_prestador").notNull(),
  arquivoXmlUrl: text("arquivo_xml_url").notNull(),
  arquivoPdfUrl: text("arquivo_pdf_url"),
  validacaoIdentidade: boolean("validacao_identidade").default(false),
  validacaoCompetencia: boolean("validacao_competencia").default(false),
  validacaoValor: boolean("validacao_valor").default(false),
  validacaoDuplicidade: boolean("validacao_duplicidade").default(false),
  mensagemValidacao: text("mensagem_validacao"),
  status: text("status").default("pendente"),
  aprovadoPor: uuid("aprovado_por").references(() => colaboradores.id),
  dataAprovacao: timestamp("data_aprovacao"),
  observacaoFinanceiro: text("observacao_financeiro"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("notas_fiscais_colaborador_numero_key").on(table.colaboradorId, table.numeroNfse),
  check("notas_fiscais_competencia_mes_check", sql`${table.competenciaMes} >= 1 AND ${table.competenciaMes} <= 12`),
  check("notas_fiscais_competencia_ano_check", sql`${table.competenciaAno} >= 2020`),
  check("notas_fiscais_valor_servico_check", sql`${table.valorServico} > 0`),
  check("notas_fiscais_status_check", sql`${table.status} IN ('pendente', 'aprovado', 'rejeitado')`),
])

export const faturas = pgTable("faturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  valor: numeric("valor", { precision: 15, scale: 2 }),
  dataVencimento: date("data_vencimento").notNull(),
  status: text("status").notNull().default("pendente"),
  arquivoPdfUrl: text("arquivo_pdf_url").notNull(),
  criadoPor: uuid("criado_por").references(() => colaboradores.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check("faturas_status_check", sql`${table.status} IN ('pendente', 'pago', 'vencido')`),
])

export const faturasColaboradores = pgTable("faturas_colaboradores", {
  id: uuid("id").primaryKey().defaultRandom(),
  faturaId: uuid("fatura_id").notNull().references(() => faturas.id, { onDelete: "cascade" }),
  colaboradorId: uuid("colaborador_id").notNull().references(() => colaboradores.id, { onDelete: "cascade" }),
  visualizado: boolean("visualizado").default(false),
  dataVisualizacao: timestamp("data_visualizacao", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("faturas_colaboradores_fatura_colaborador_key").on(table.faturaId, table.colaboradorId),
])

export const userTermsAcceptance = pgTable("user_terms_acceptance", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => colaboradores.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 20 }).notNull(),
  accepted: boolean("accepted").notNull().default(false),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  ipAddress: varchar("ip_address", { length: 45 }),
  deviceInfo: text("device_info"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("user_terms_acceptance_user_version_key").on(table.userId, table.version),
])

export const systemStatus = pgTable("system_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  isActive: boolean("is_active").notNull().default(true),
  suspendedReason: text("suspended_reason"),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedBy: uuid("suspended_by").references(() => colaboradores.id),
  reactivatedAt: timestamp("reactivated_at", { withTimezone: true }),
  reactivatedBy: uuid("reactivated_by").references(() => colaboradores.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, () => [
  // Garante que só exista uma linha na tabela (idioma do script original 050_create_system_status.sql).
  uniqueIndex("system_status_single_row").on(sql`(true)`),
])

// NOTA: script 051_create_boletos.sql (fonte da verdade da DDL efetivamente aplicada) usa
// `tipo_boleto`, mas app/actions/boletos.ts referencia `tipo` — nenhuma UI chama essas actions
// hoje, então o schema segue a DDL real; app/actions/boletos.ts foi corrigido para bater com ela.
export const boletos = pgTable("boletos", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroBoleto: text("numero_boleto").notNull().unique(),
  banco: text("banco").notNull(),
  agencia: text("agencia").notNull(),
  conta: text("conta").notNull(),
  digitoVerificador: text("digito_verificador"),
  centroCustoId: uuid("centro_custo_id").references(() => centrosCusto.id),
  tipoBoleto: text("tipo_boleto").default("cedente"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  criadoPor: uuid("criado_por").references(() => colaboradores.id),
})

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  colaboradorId: uuid("colaborador_id").references(() => colaboradores.id),
  acao: text("acao").notNull(),
  tabela: text("tabela"),
  registroId: text("registro_id"),
  detalhes: jsonb("detalhes"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// ---------- Relations (equivalente aos embedded selects do Supabase, ex: .select("*, colaborador:colaboradores(...)")) ----------

export const colaboradoresRelations = relations(colaboradores, ({ one, many }) => ({
  equipe: one(equipes, { fields: [colaboradores.equipeId], references: [equipes.id] }),
  centroCusto: one(centrosCusto, { fields: [colaboradores.centroCustoId], references: [centrosCusto.id] }),
  pedidos: many(pedidosPagamento),
  gerenciaEquipes: many(gerentesEquipes),
}))

export const equipesRelations = relations(equipes, ({ one, many }) => ({
  supervisor: one(colaboradores, { fields: [equipes.supervisorId], references: [colaboradores.id] }),
  colaboradores: many(colaboradores),
  gerentes: many(gerentesEquipes),
}))

export const gerentesEquipesRelations = relations(gerentesEquipes, ({ one }) => ({
  gerente: one(colaboradores, { fields: [gerentesEquipes.gerenteId], references: [colaboradores.id] }),
  equipe: one(equipes, { fields: [gerentesEquipes.equipeId], references: [equipes.id] }),
}))

export const pedidosPagamentoRelations = relations(pedidosPagamento, ({ one }) => ({
  colaborador: one(colaboradores, { fields: [pedidosPagamento.colaboradorId], references: [colaboradores.id] }),
  criadoPorColaborador: one(colaboradores, {
    fields: [pedidosPagamento.criadoPorColaboradorId],
    references: [colaboradores.id],
  }),
  notaFiscal: one(notasFiscais, { fields: [pedidosPagamento.id], references: [notasFiscais.pedidoId] }),
}))

export const historicoReajustesRelations = relations(historicoReajustes, ({ one }) => ({
  colaborador: one(colaboradores, { fields: [historicoReajustes.colaboradorId], references: [colaboradores.id] }),
  aplicadoPorColaborador: one(colaboradores, {
    fields: [historicoReajustes.aplicadoPor],
    references: [colaboradores.id],
  }),
}))

export const notasFiscaisRelations = relations(notasFiscais, ({ one }) => ({
  pedido: one(pedidosPagamento, { fields: [notasFiscais.pedidoId], references: [pedidosPagamento.id] }),
  colaborador: one(colaboradores, { fields: [notasFiscais.colaboradorId], references: [colaboradores.id] }),
}))

export const faturasRelations = relations(faturas, ({ many }) => ({
  colaboradores: many(faturasColaboradores),
}))

export const faturasColaboradoresRelations = relations(faturasColaboradores, ({ one }) => ({
  fatura: one(faturas, { fields: [faturasColaboradores.faturaId], references: [faturas.id] }),
  colaborador: one(colaboradores, { fields: [faturasColaboradores.colaboradorId], references: [colaboradores.id] }),
}))

export const boletosRelations = relations(boletos, ({ one }) => ({
  centroCusto: one(centrosCusto, { fields: [boletos.centroCustoId], references: [centrosCusto.id] }),
}))
