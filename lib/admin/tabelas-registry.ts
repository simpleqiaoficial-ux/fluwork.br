import { getTableName } from "drizzle-orm"
import * as schema from "@/lib/db/schema"

// Registro central de todas as tabelas do banco pro Espelho de Dados (SuperAdmin) — cada
// entrada só precisa do objeto da tabela (lib/db/schema.ts) e um rótulo amigável; o slug da
// URL e as colunas são sempre derivados por introspecção (getTableName/getTableColumns), então
// uma tabela nova só exige uma linha aqui, nunca uma página nova.
export interface TabelaRegistrada {
  table: any
  label: string
  grupo: string
}

export const TABELAS_REGISTRADAS: TabelaRegistrada[] = [
  { table: schema.empresas, label: "Empresas", grupo: "Empresas & Acesso" },
  { table: schema.colaboradores, label: "Colaboradores", grupo: "Empresas & Acesso" },
  { table: schema.equipes, label: "Equipes", grupo: "Empresas & Acesso" },
  { table: schema.centrosCusto, label: "Centros de Custo", grupo: "Empresas & Acesso" },
  { table: schema.gerentesEquipes, label: "Gerentes de Equipe", grupo: "Empresas & Acesso" },

  { table: schema.pedidosPagamento, label: "Ordens de Pagamento", grupo: "Financeiro" },
  { table: schema.historicoReajustes, label: "Histórico de Reajustes", grupo: "Financeiro" },
  { table: schema.notasFiscais, label: "Notas Fiscais", grupo: "Financeiro" },
  { table: schema.faturas, label: "Faturas", grupo: "Financeiro" },
  { table: schema.faturasColaboradores, label: "Faturas × Colaboradores", grupo: "Financeiro" },
  { table: schema.boletos, label: "Boletos", grupo: "Financeiro" },

  { table: schema.contractTemplates, label: "Modelos de Contrato", grupo: "Contratos" },
  { table: schema.contracts, label: "Contratos", grupo: "Contratos" },
  { table: schema.contractAmendments, label: "Aditivos Contratuais", grupo: "Contratos" },
  { table: schema.contractSigners, label: "Signatários", grupo: "Contratos" },
  { table: schema.contractSignatureEvents, label: "Eventos de Assinatura", grupo: "Contratos" },
  { table: schema.contractAttachments, label: "Anexos de Contrato", grupo: "Contratos" },

  { table: schema.ehsClientes, label: "Clientes EHS", grupo: "EHS & Compliance" },
  { table: schema.ehsClienteResponsaveis, label: "Responsáveis do Cliente", grupo: "EHS & Compliance" },
  { table: schema.ehsIntegracoes, label: "Integrações", grupo: "EHS & Compliance" },
  { table: schema.ehsTiposDocumento, label: "Tipos de Documento", grupo: "EHS & Compliance" },
  { table: schema.ehsDocumentos, label: "Documentos", grupo: "EHS & Compliance" },
  { table: schema.ehsCarteirinhas, label: "Carteirinhas Digitais", grupo: "EHS & Compliance" },
  { table: schema.ehsTimelineEventos, label: "Timeline", grupo: "EHS & Compliance" },
  { table: schema.ehsAuditoria, label: "Auditoria EHS", grupo: "EHS & Compliance" },
  { table: schema.ehsPermissoes, label: "Permissões (catálogo)", grupo: "EHS & Compliance" },
  { table: schema.ehsPapelPermissoes, label: "Papel × Permissão", grupo: "EHS & Compliance" },

  { table: schema.userTermsAcceptance, label: "Aceites de Termos", grupo: "Sistema" },
  { table: schema.systemStatus, label: "Status do Sistema", grupo: "Sistema" },
  { table: schema.auditLog, label: "Log de Auditoria (geral)", grupo: "Sistema" },
]

export function encontrarTabelaPorSlug(slug: string): TabelaRegistrada | undefined {
  return TABELAS_REGISTRADAS.find((t) => getTableName(t.table) === slug)
}
