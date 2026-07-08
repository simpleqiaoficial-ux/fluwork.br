import { relations, sql } from "drizzle-orm"
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
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
  // Papel do time do FluWork (operador da plataforma SaaS) — enxerga todas as empresas.
  // Único valor do enum sem empresa_id (ver check constraint em `colaboradores`).
  "SuperAdmin",
])

// Empresa cliente (tenant). Tudo que pertence a uma empresa cliente referencia esta tabela
// via empresa_id — isolamento obrigatório entre empresas, exceto para SuperAdmin.
export const empresas = pgTable("empresas", {
  id: uuid("id").primaryKey().defaultRandom(),
  razaoSocial: text("razao_social").notNull(),
  nomeFantasia: text("nome_fantasia"),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  logoUrl: text("logo_url"),
  papelTimbradoUrl: text("papel_timbrado_url"),
  rodapeContrato: text("rodape_contrato"),
  representanteNome: text("representante_nome"),
  representanteDocumento: text("representante_documento"),
  representanteCargo: text("representante_cargo"),
  status: text("status").notNull().default("active"),
  // Endereço estruturado (tomador de serviço na NFS-e) — mesmo padrão de colaboradores.
  // `endereco` (texto livre) acima é mantido por compatibilidade com o resto do app.
  enderecoCep: text("endereco_cep"),
  enderecoLogradouro: text("endereco_logradouro"),
  enderecoNumero: text("endereco_numero"),
  enderecoComplemento: text("endereco_complemento"),
  enderecoBairro: text("endereco_bairro"),
  enderecoCidade: text("endereco_cidade"),
  enderecoUf: text("endereco_uf"),
  // Cache do código de município IBGE (7 dígitos), resolvido uma vez via API do IBGE.
  codigoMunicipioIbge: text("codigo_municipio_ibge"),
  // Configuração fiscal padrão usada em toda emissão de NFS-e pela empresa.
  codigoServicoPadrao: text("codigo_servico_padrao"),
  discriminacaoServicoPadrao: text("discriminacao_servico_padrao"),
  aliquotaIssPadrao: numeric("aliquota_iss_padrao", { precision: 5, scale: 2 }),
  issRetidoPadrao: boolean("iss_retido_padrao").default(false),
  linkEmissaoManual: text("link_emissao_manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check("empresas_status_check", sql`${table.status} IN ('active', 'inactive', 'blocked')`),
])

export const centrosCusto = pgTable("centros_custo", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  numero: text("numero").notNull(),
  nome: text("nome").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("centros_custo_empresa_numero_key").on(table.empresaId, table.numero),
])

export const equipes = pgTable("equipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  supervisorId: uuid("supervisor_id").references((): AnyPgColumn => colaboradores.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("equipes_empresa_nome_key").on(table.empresaId, table.nome),
])

export const colaboradores = pgTable("colaboradores", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
  nomeCompleto: text("nome_completo").notNull(),
  salario: numeric("salario", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  cnpj: text("cnpj"),
  // Dados da empresa (PJ) por trás do CNPJ — preenchidos automaticamente pela consulta à
  // Receita Federal no cadastro, mas editáveis. dataAbertura é a data de abertura do CNPJ,
  // que substitui dataNascimento como a data "obrigatória" do cadastro (a conta pertence à
  // empresa, não a uma pessoa física — dataNascimento abaixo agora é só opcional).
  razaoSocial: text("razao_social"),
  dataAbertura: date("data_abertura"),
  enderecoCep: text("endereco_cep"),
  enderecoLogradouro: text("endereco_logradouro"),
  enderecoNumero: text("endereco_numero"),
  enderecoComplemento: text("endereco_complemento"),
  enderecoBairro: text("endereco_bairro"),
  enderecoCidade: text("endereco_cidade"),
  enderecoUf: text("endereco_uf"),
  // Pessoa física opcional vinculada ao prestador (ex.: sócio/responsável) — nome/nascimento
  // usados só pra facilitar a gestão interna, nunca exigidos no cadastro.
  dataNascimento: date("data_nascimento"),
  email: text("email").unique(),
  // Resquício do Supabase Auth (auth.users) — mantido como UUID solto, sem FK,
  // pois o schema auth.* não existe fora do Supabase e a auth já é 100% customizada.
  userId: uuid("user_id"),
  tipoAcesso: tipoAcessoEnum("tipo_acesso").default("Colaborador"),
  senhaHash: text("senha_hash"),
  equipeId: uuid("equipe_id").references((): AnyPgColumn => equipes.id, { onDelete: "set null" }),
  historicoReajustes: jsonb("historico_reajustes").default([]),
  diaPagamento: integer("dia_pagamento").default(1),
  chavePix: text("chave_pix"),
  centroCustoId: uuid("centro_custo_id").references(() => centrosCusto.id, { onDelete: "set null" }),
  tipoChavePix: text("tipo_chave_pix"),
  dataAniversarioContrato: date("data_aniversario_contrato"),
  // Dados fiscais pra emissão de NFS-e (prestador de serviço).
  codigoMunicipioIbge: text("codigo_municipio_ibge"),
  inscricaoMunicipal: text("inscricao_municipal"),
  regimeTributario: text("regime_tributario"),
  // Cadastro do prestador na Focus NFe (certificado digital) — nunca guardamos o certificado
  // ou a senha, só o resultado do cadastro. Ver lib/focus-nfe.ts.
  focusStatusCadastro: text("focus_status_cadastro").default("nao_cadastrado"),
  focusCadastradoEm: timestamp("focus_cadastrado_em", { withTimezone: true }),
  focusMotivoErroCadastro: text("focus_motivo_erro_cadastro"),
}, (table) => [
  check("colaboradores_dia_pagamento_check", sql`${table.diaPagamento} IN (1, 15)`),
  check(
    "colaboradores_regime_tributario_check",
    sql`${table.regimeTributario} IS NULL OR ${table.regimeTributario} IN ('simples_nacional', 'simples_nacional_excesso', 'regime_normal')`,
  ),
  check(
    "colaboradores_focus_status_cadastro_check",
    sql`${table.focusStatusCadastro} IN ('nao_cadastrado', 'cadastrado', 'erro')`,
  ),
  // SuperAdmin é o único papel sem empresa (opera a plataforma inteira); todos os demais
  // papéis (Adm/Financeiro/Gerente/Supervisor/Colaborador) precisam estar vinculados a uma empresa.
  check(
    "colaboradores_empresa_id_check",
    sql`(${table.tipoAcesso} = 'SuperAdmin') = (${table.empresaId} IS NULL)`,
  ),
  index("colaboradores_empresa_id_idx").on(table.empresaId),
])

export const gerentesEquipes = pgTable("gerentes_equipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  gerenteId: uuid("gerente_id").notNull().references(() => colaboradores.id, { onDelete: "cascade" }),
  equipeId: uuid("equipe_id").notNull().references(() => equipes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("gerentes_equipes_gerente_equipe_key").on(table.gerenteId, table.equipeId),
])

export const pedidosPagamento = pgTable("pedidos_pagamento", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
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
  // 'nota_recebida' não existe em nenhum dos 59 scripts SQL legados (o CHECK constraint mais
  // recente rastreado, 040_add_status_prorrogacao.sql, não o inclui), mas o valor é usado
  // ativamente em app/actions/pedidos.ts e em várias páginas — o banco real do Supabase foi
  // alterado manualmente fora dos scripts (mesmo padrão do caso boletos.tipo_boleto).
  check(
    "pedidos_pagamento_status_check",
    sql`${table.status} IN ('pendente_gerente', 'pendente_financeiro', 'aprovado', 'recusado', 'correcao', 'pago', 'aguardando_prorrogacao', 'prorrogacao_negada', 'nota_recebida')`,
  ),
  check("pedidos_pagamento_tipo_pedido_check", sql`${table.tipoPedido} IN ('completo', 'reembolso_km')`),
  index("pedidos_pagamento_empresa_id_idx").on(table.empresaId),
])

export const historicoReajustes = pgTable("historico_reajustes", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
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
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  pedidoId: uuid("pedido_id").references(() => pedidosPagamento.id, { onDelete: "cascade" }).unique(),
  colaboradorId: uuid("colaborador_id").references(() => colaboradores.id, { onDelete: "cascade" }),
  // numeroNfse e arquivoXmlUrl não são mais NOT NULL: uma emissão via Focus NFe cria a linha
  // desde "processando_autorizacao", antes de existir número ou XML — só o fluxo manual
  // (que sempre parte de um arquivo já emitido) continua preenchendo os dois no insert.
  numeroNfse: text("numero_nfse"),
  chaveAcesso: text("chave_acesso"),
  competenciaMes: integer("competencia_mes").notNull(),
  competenciaAno: integer("competencia_ano").notNull(),
  valorServico: numeric("valor_servico", { precision: 10, scale: 2 }).notNull(),
  cpfCnpjPrestador: text("cpf_cnpj_prestador").notNull(),
  arquivoXmlUrl: text("arquivo_xml_url"),
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
  // Origem da nota e dados específicos da emissão via Focus NFe.
  origem: text("origem").notNull().default("manual"),
  focusRef: text("focus_ref").unique(),
  focusStatus: text("focus_status"),
  focusMotivoErro: text("focus_motivo_erro"),
  focusNumeroRps: text("focus_numero_rps"),
  focusSerieRps: text("focus_serie_rps"),
  focusRawResponse: jsonb("focus_raw_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("notas_fiscais_colaborador_numero_key").on(table.colaboradorId, table.numeroNfse),
  check("notas_fiscais_competencia_mes_check", sql`${table.competenciaMes} >= 1 AND ${table.competenciaMes} <= 12`),
  check("notas_fiscais_competencia_ano_check", sql`${table.competenciaAno} >= 2020`),
  check("notas_fiscais_valor_servico_check", sql`${table.valorServico} > 0`),
  check("notas_fiscais_status_check", sql`${table.status} IN ('pendente', 'aprovado', 'rejeitado')`),
  check("notas_fiscais_origem_check", sql`${table.origem} IN ('manual', 'focus_nfe')`),
  check(
    "notas_fiscais_focus_status_check",
    sql`${table.focusStatus} IS NULL OR ${table.focusStatus} IN ('processando_autorizacao', 'autorizado', 'erro_autorizacao', 'cancelado')`,
  ),
  index("notas_fiscais_empresa_id_idx").on(table.empresaId),
])

// Log de eventos da integração Focus NFe (cadastro de prestador, emissão, consulta, webhook,
// erro) — separado de audit_log porque registrarAuditoria() usa headers() do Next (só funciona
// dentro de uma request ativa, não serve pra um job/cron) e não tem campos pra status HTTP/
// payload/duração. Nunca grava certificado digital ou senha (sanitizado antes de logar).
export const focusNfeEventos = pgTable("focus_nfe_eventos", {
  id: uuid("id").primaryKey().defaultRandom(),
  notaFiscalId: uuid("nota_fiscal_id").references(() => notasFiscais.id, { onDelete: "cascade" }),
  colaboradorId: uuid("colaborador_id").references(() => colaboradores.id, { onDelete: "cascade" }),
  tipoEvento: text("tipo_evento").notNull(),
  statusHttp: integer("status_http"),
  payload: jsonb("payload"),
  mensagem: text("mensagem"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check(
    "focus_nfe_eventos_tipo_evento_check",
    sql`${table.tipoEvento} IN ('cadastro_empresa_focus', 'emissao_solicitada', 'consulta_status', 'webhook_recebido', 'erro')`,
  ),
  index("focus_nfe_eventos_nota_fiscal_id_idx").on(table.notaFiscalId),
])

export const faturas = pgTable("faturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
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
  index("faturas_empresa_id_idx").on(table.empresaId),
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
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
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
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  numeroBoleto: text("numero_boleto").notNull(),
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
}, (table) => [
  uniqueIndex("boletos_empresa_numero_key").on(table.empresaId, table.numeroBoleto),
])

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: ações de nível plataforma (ex: SuperAdmin bloqueando uma empresa) não têm empresa.
  empresaId: uuid("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
  colaboradorId: uuid("colaborador_id").references(() => colaboradores.id),
  acao: text("acao").notNull(),
  tabela: text("tabela"),
  registroId: text("registro_id"),
  detalhes: jsonb("detalhes"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("audit_log_empresa_id_idx").on(table.empresaId),
  index("audit_log_created_at_idx").on(table.createdAt),
])

// ---------- Contratos (assinatura eletrônica) ----------

export const contractTemplates = pgTable("contract_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: um template com empresa_id NULL é um modelo global do FluWork, copiável por
  // qualquer empresa; um template com empresa_id preenchido pertence só àquela empresa.
  empresaId: uuid("empresa_id").references(() => empresas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  slug: text("slug").notNull(),
  versao: integer("versao").notNull().default(1),
  ativo: boolean("ativo").notNull().default(true),
  corpo: text("corpo").notNull(),
  camposVariaveis: jsonb("campos_variaveis").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex("contract_templates_empresa_slug_key").on(table.empresaId, table.slug),
])

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => contractTemplates.id),
  numero: text("numero").notNull().unique(),
  prestadorColaboradorId: uuid("prestador_colaborador_id").references(() => colaboradores.id, { onDelete: "set null" }),
  // Equipe pretendida pro prestador — usada pra derivar supervisor/gerente na hora de
  // auto-provisionar o colaborador (ver enviarContrato) e como filtro de busca (seção 10 do CLM).
  equipeId: uuid("equipe_id").references(() => equipes.id, { onDelete: "set null" }),
  prestadorNome: text("prestador_nome").notNull(),
  prestadorCpfCnpj: text("prestador_cpf_cnpj").notNull(),
  prestadorEmail: text("prestador_email").notNull(),
  prestadorEndereco: text("prestador_endereco"),
  tipoServico: text("tipo_servico").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  prazo: text("prazo").notNull(),
  dataInicio: date("data_inicio").notNull(),
  // Vigência real do contrato — usada por lib/contracts/vigencia.ts pra calcular a
  // sinalização visual (Vigente/Vence em X dias/Vencido) sem precisar de job agendado.
  dataTermino: date("data_termino"),
  renovacaoAutomatica: boolean("renovacao_automatica").notNull().default(false),
  tipoRenovacao: text("tipo_renovacao"),
  periodoRenovacaoMeses: integer("periodo_renovacao_meses"),
  dataUltimaRenovacao: timestamp("data_ultima_renovacao", { withTimezone: true }),
  clausulasAdicionais: text("clausulas_adicionais"),
  status: text("status").notNull().default("draft"),
  versaoAtual: integer("versao_atual").notNull().default(1),
  pdfDraftPath: text("pdf_draft_path"),
  pdfSignedPath: text("pdf_signed_path"),
  pdfHash: text("pdf_hash"),
  enviadoEm: timestamp("enviado_em", { withTimezone: true }),
  expiraEm: timestamp("expira_em", { withTimezone: true }),
  visualizadoEm: timestamp("visualizado_em", { withTimezone: true }),
  assinadoEm: timestamp("assinado_em", { withTimezone: true }),
  recusadoEm: timestamp("recusado_em", { withTimezone: true }),
  motivoRecusa: text("motivo_recusa"),
  canceladoEm: timestamp("cancelado_em", { withTimezone: true }),
  canceladoPor: uuid("cancelado_por").references(() => colaboradores.id),
  criadoPor: uuid("criado_por").notNull().references(() => colaboradores.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check(
    "contracts_status_check",
    // 'archived' é o único status novo persistido pelo CLM — os demais estados de vigência
    // (Vigente/Vence em X dias/Vencido) são calculados em lib/contracts/vigencia.ts, nunca gravados.
    sql`${table.status} IN ('draft','sent','viewed','signed','refused','expired','cancelled','archived')`,
  ),
  check("contracts_valor_check", sql`${table.valor} > 0`),
  check(
    "contracts_tipo_renovacao_check",
    sql`${table.tipoRenovacao} IS NULL OR ${table.tipoRenovacao} IN ('automatica','mediante_aviso','sem_renovacao')`,
  ),
  index("contracts_empresa_id_idx").on(table.empresaId),
])

// Aditivo contratual — nunca substitui o contrato base, gera sua própria versão em
// contract_attachments e passa pelo mesmo pipeline de assinatura (contract_signers/
// contract_signature_events), só que escopado via amendment_id em vez de ser o documento principal.
export const contractAmendments = pgTable("contract_amendments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  versao: integer("versao").notNull(),
  descricao: text("descricao"),
  camposAlterados: jsonb("campos_alterados").default({}),
  novoValor: numeric("novo_valor", { precision: 12, scale: 2 }),
  novaDataTermino: date("nova_data_termino"),
  novasClausulas: text("novas_clausulas"),
  status: text("status").notNull().default("draft"),
  enviadoEm: timestamp("enviado_em", { withTimezone: true }),
  visualizadoEm: timestamp("visualizado_em", { withTimezone: true }),
  assinadoEm: timestamp("assinado_em", { withTimezone: true }),
  recusadoEm: timestamp("recusado_em", { withTimezone: true }),
  motivoRecusa: text("motivo_recusa"),
  canceladoEm: timestamp("cancelado_em", { withTimezone: true }),
  pdfPath: text("pdf_path"),
  criadoPor: uuid("criado_por").notNull().references(() => colaboradores.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check(
    "contract_amendments_tipo_check",
    sql`${table.tipo} IN ('aditivo_salarial','aditivo_clausulas','renovacao','outro')`,
  ),
  check(
    "contract_amendments_status_check",
    sql`${table.status} IN ('draft','sent','viewed','signed','refused','expired','cancelled')`,
  ),
])

export const contractSigners = pgTable("contract_signers", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  // Nulo = assinatura do contrato base; preenchido = assinatura de um aditivo específico
  // deste mesmo contrato (mesmo pipeline de token/e-mail, documento diferente).
  amendmentId: uuid("amendment_id").references(() => contractAmendments.id, { onDelete: "cascade" }),
  colaboradorId: uuid("colaborador_id").references(() => colaboradores.id, { onDelete: "set null" }),
  papel: text("papel").notNull().default("prestador"),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  cpfCnpj: text("cpf_cnpj").notNull(),
  status: text("status").notNull().default("pendente"),
  tokenHash: text("token_hash").notNull(),
  tokenExpiraEm: timestamp("token_expira_em", { withTimezone: true }).notNull(),
  tokenUsadoEm: timestamp("token_usado_em", { withTimezone: true }),
  primeiraVisualizacaoEm: timestamp("primeira_visualizacao_em", { withTimezone: true }),
  ipUltimoAcesso: text("ip_ultimo_acesso"),
  userAgentUltimoAcesso: text("user_agent_ultimo_acesso"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  check("contract_signers_papel_check", sql`${table.papel} IN ('prestador')`),
  check(
    "contract_signers_status_check",
    sql`${table.status} IN ('pendente','visualizado','assinado','recusado','expirado')`,
  ),
  uniqueIndex("contract_signers_token_hash_key").on(table.tokenHash),
])

export const contractSignatureEvents = pgTable("contract_signature_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  amendmentId: uuid("amendment_id").references(() => contractAmendments.id, { onDelete: "cascade" }),
  signerId: uuid("signer_id").references(() => contractSigners.id, { onDelete: "cascade" }),
  // Quem do lado admin disparou o evento (criar/enviar/cancelar/renovar/arquivar) — o signatário
  // (prestador) já é rastreado via signerId/ipAddress; isso cobre a auditoria do lado empresa (seção 13 do CLM).
  atorColaboradorId: uuid("ator_colaborador_id").references(() => colaboradores.id),
  tipoEvento: text("tipo_evento").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  tokenHash: text("token_hash"),
  contractVersao: integer("contract_versao"),
  pdfHash: text("pdf_hash"),
  emailSnapshot: text("email_snapshot"),
  detalhes: jsonb("detalhes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check(
    "contract_signature_events_tipo_check",
    sql`${table.tipoEvento} IN ('criado','enviado','reenviado','visualizado','aceite_marcado','assinado','recusado','expirado','cancelado','vigencia_iniciada','aditivo_criado','aditivo_enviado','aditivo_assinado','aditivo_recusado','renovado','encerrado','arquivado','senha_definida')`,
  ),
])

export const contractAttachments = pgTable("contract_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contractId: uuid("contract_id").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  versao: integer("versao").notNull(),
  objectPath: text("object_path").notNull(),
  hashSha256: text("hash_sha256").notNull(),
  tamanhoBytes: integer("tamanho_bytes"),
  geradoPor: uuid("gerado_por").references(() => colaboradores.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("contract_attachments_tipo_check", sql`${table.tipo} IN ('rascunho','assinado','anexo')`),
])

// ---------- Relations (equivalente aos embedded selects do Supabase, ex: .select("*, colaborador:colaboradores(...)")) ----------

export const empresasRelations = relations(empresas, ({ many }) => ({
  colaboradores: many(colaboradores),
  equipes: many(equipes),
  centrosCusto: many(centrosCusto),
  pedidos: many(pedidosPagamento),
  historicoReajustes: many(historicoReajustes),
  notasFiscais: many(notasFiscais),
  faturas: many(faturas),
  boletos: many(boletos),
  contractTemplates: many(contractTemplates),
  contracts: many(contracts),
}))

export const colaboradoresRelations = relations(colaboradores, ({ one, many }) => ({
  empresa: one(empresas, { fields: [colaboradores.empresaId], references: [empresas.id] }),
  equipe: one(equipes, { fields: [colaboradores.equipeId], references: [equipes.id] }),
  centroCusto: one(centrosCusto, { fields: [colaboradores.centroCustoId], references: [centrosCusto.id] }),
  pedidos: many(pedidosPagamento),
  gerenciaEquipes: many(gerentesEquipes),
}))

export const equipesRelations = relations(equipes, ({ one, many }) => ({
  empresa: one(empresas, { fields: [equipes.empresaId], references: [empresas.id] }),
  supervisor: one(colaboradores, { fields: [equipes.supervisorId], references: [colaboradores.id] }),
  colaboradores: many(colaboradores),
  gerentes: many(gerentesEquipes),
}))

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  empresa: one(empresas, { fields: [auditLog.empresaId], references: [empresas.id] }),
  colaborador: one(colaboradores, { fields: [auditLog.colaboradorId], references: [colaboradores.id] }),
}))

export const centrosCustoRelations = relations(centrosCusto, ({ one }) => ({
  empresa: one(empresas, { fields: [centrosCusto.empresaId], references: [empresas.id] }),
}))

export const gerentesEquipesRelations = relations(gerentesEquipes, ({ one }) => ({
  empresa: one(empresas, { fields: [gerentesEquipes.empresaId], references: [empresas.id] }),
  gerente: one(colaboradores, { fields: [gerentesEquipes.gerenteId], references: [colaboradores.id] }),
  equipe: one(equipes, { fields: [gerentesEquipes.equipeId], references: [equipes.id] }),
}))

export const pedidosPagamentoRelations = relations(pedidosPagamento, ({ one }) => ({
  empresa: one(empresas, { fields: [pedidosPagamento.empresaId], references: [empresas.id] }),
  colaborador: one(colaboradores, { fields: [pedidosPagamento.colaboradorId], references: [colaboradores.id] }),
  criadoPorColaborador: one(colaboradores, {
    fields: [pedidosPagamento.criadoPorColaboradorId],
    references: [colaboradores.id],
  }),
  notaFiscal: one(notasFiscais, { fields: [pedidosPagamento.id], references: [notasFiscais.pedidoId] }),
}))

export const historicoReajustesRelations = relations(historicoReajustes, ({ one }) => ({
  empresa: one(empresas, { fields: [historicoReajustes.empresaId], references: [empresas.id] }),
  colaborador: one(colaboradores, { fields: [historicoReajustes.colaboradorId], references: [colaboradores.id] }),
  aplicadoPorColaborador: one(colaboradores, {
    fields: [historicoReajustes.aplicadoPor],
    references: [colaboradores.id],
  }),
}))

export const notasFiscaisRelations = relations(notasFiscais, ({ one, many }) => ({
  empresa: one(empresas, { fields: [notasFiscais.empresaId], references: [empresas.id] }),
  pedido: one(pedidosPagamento, { fields: [notasFiscais.pedidoId], references: [pedidosPagamento.id] }),
  colaborador: one(colaboradores, { fields: [notasFiscais.colaboradorId], references: [colaboradores.id] }),
  eventos: many(focusNfeEventos),
}))

export const focusNfeEventosRelations = relations(focusNfeEventos, ({ one }) => ({
  notaFiscal: one(notasFiscais, { fields: [focusNfeEventos.notaFiscalId], references: [notasFiscais.id] }),
  colaborador: one(colaboradores, { fields: [focusNfeEventos.colaboradorId], references: [colaboradores.id] }),
}))

export const faturasRelations = relations(faturas, ({ one, many }) => ({
  empresa: one(empresas, { fields: [faturas.empresaId], references: [empresas.id] }),
  colaboradores: many(faturasColaboradores),
}))

export const faturasColaboradoresRelations = relations(faturasColaboradores, ({ one }) => ({
  fatura: one(faturas, { fields: [faturasColaboradores.faturaId], references: [faturas.id] }),
  colaborador: one(colaboradores, { fields: [faturasColaboradores.colaboradorId], references: [colaboradores.id] }),
}))

export const boletosRelations = relations(boletos, ({ one }) => ({
  empresa: one(empresas, { fields: [boletos.empresaId], references: [empresas.id] }),
  centroCusto: one(centrosCusto, { fields: [boletos.centroCustoId], references: [centrosCusto.id] }),
}))

export const contractTemplatesRelations = relations(contractTemplates, ({ one, many }) => ({
  empresa: one(empresas, { fields: [contractTemplates.empresaId], references: [empresas.id] }),
  contracts: many(contracts),
}))

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  empresa: one(empresas, { fields: [contracts.empresaId], references: [empresas.id] }),
  template: one(contractTemplates, { fields: [contracts.templateId], references: [contractTemplates.id] }),
  equipe: one(equipes, { fields: [contracts.equipeId], references: [equipes.id] }),
  prestadorColaborador: one(colaboradores, {
    fields: [contracts.prestadorColaboradorId],
    references: [colaboradores.id],
  }),
  criadoPorColaborador: one(colaboradores, { fields: [contracts.criadoPor], references: [colaboradores.id] }),
  canceladoPorColaborador: one(colaboradores, { fields: [contracts.canceladoPor], references: [colaboradores.id] }),
  signers: many(contractSigners),
  events: many(contractSignatureEvents),
  attachments: many(contractAttachments),
  amendments: many(contractAmendments),
}))

export const contractAmendmentsRelations = relations(contractAmendments, ({ one, many }) => ({
  contract: one(contracts, { fields: [contractAmendments.contractId], references: [contracts.id] }),
  criadoPorColaborador: one(colaboradores, { fields: [contractAmendments.criadoPor], references: [colaboradores.id] }),
  signers: many(contractSigners),
  events: many(contractSignatureEvents),
}))

export const contractSignersRelations = relations(contractSigners, ({ one, many }) => ({
  contract: one(contracts, { fields: [contractSigners.contractId], references: [contracts.id] }),
  amendment: one(contractAmendments, { fields: [contractSigners.amendmentId], references: [contractAmendments.id] }),
  colaborador: one(colaboradores, { fields: [contractSigners.colaboradorId], references: [colaboradores.id] }),
  events: many(contractSignatureEvents),
}))

export const contractSignatureEventsRelations = relations(contractSignatureEvents, ({ one }) => ({
  contract: one(contracts, { fields: [contractSignatureEvents.contractId], references: [contracts.id] }),
  amendment: one(contractAmendments, {
    fields: [contractSignatureEvents.amendmentId],
    references: [contractAmendments.id],
  }),
  signer: one(contractSigners, { fields: [contractSignatureEvents.signerId], references: [contractSigners.id] }),
  ator: one(colaboradores, { fields: [contractSignatureEvents.atorColaboradorId], references: [colaboradores.id] }),
}))

export const contractAttachmentsRelations = relations(contractAttachments, ({ one }) => ({
  contract: one(contracts, { fields: [contractAttachments.contractId], references: [contracts.id] }),
  geradoPorColaborador: one(colaboradores, { fields: [contractAttachments.geradoPor], references: [colaboradores.id] }),
}))
