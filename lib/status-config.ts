import { FileEdit, Send, Eye, CheckCircle2, XCircle, Clock, Ban, Archive, AlertTriangle, FileCheck, PauseCircle, type LucideIcon } from "lucide-react"
import type { BadgeProps } from "@/components/ui/badge"

export type StatusVariant = NonNullable<BadgeProps["variant"]>

export interface StatusConfigEntry {
  label: string
  variant: StatusVariant
  icon: LucideIcon
}

/** Fonte única de verdade para status → { label, cor, ícone } por tipo de entidade.
 *  Substitui os STATUS_CONFIG/STATUS_LABELS locais que existiam duplicados em ~16 arquivos. */
export const CONTRATO_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  draft: { label: "Rascunho", variant: "neutral", icon: FileEdit },
  sent: { label: "Enviado", variant: "info", icon: Send },
  viewed: { label: "Visualizado", variant: "warning", icon: Eye },
  signed: { label: "Assinado", variant: "success", icon: CheckCircle2 },
  refused: { label: "Recusado", variant: "destructive", icon: XCircle },
  expired: { label: "Link expirado", variant: "destructive", icon: Clock },
  cancelled: { label: "Cancelado", variant: "neutral", icon: Ban },
  archived: { label: "Arquivado", variant: "neutral", icon: Archive },
}

export const PEDIDO_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  pendente_gerente: { label: "Aguardando 1º Aprovador", variant: "neutral", icon: Clock },
  pendente_financeiro: { label: "Aguardando Aprovador Final", variant: "neutral", icon: Clock },
  aprovado: { label: "Aprovado", variant: "success", icon: CheckCircle2 },
  pago: { label: "Pago", variant: "success", icon: CheckCircle2 },
  nota_recebida: { label: "Documento Fiscal Recebido", variant: "success", icon: FileCheck },
  recusado: { label: "Recusado", variant: "destructive", icon: XCircle },
  correcao: { label: "Em Correção", variant: "warning", icon: AlertTriangle },
  aguardando_prorrogacao: { label: "Aguardando Prorrogação", variant: "neutral", icon: Clock },
  prorrogacao_negada: { label: "Prorrogação Negada", variant: "destructive", icon: XCircle },
}

export const EMPRESA_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  active: { label: "Ativa", variant: "success", icon: CheckCircle2 },
  inactive: { label: "Inativa", variant: "neutral", icon: PauseCircle },
  blocked: { label: "Bloqueada", variant: "destructive", icon: Ban },
}

export const NOTA_FISCAL_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  pendente: { label: "Pendente", variant: "neutral", icon: Clock },
  aprovado: { label: "Aprovado", variant: "success", icon: CheckCircle2 },
  rejeitado: { label: "Rejeitado", variant: "destructive", icon: XCircle },
}

export const EHS_CLIENTE_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  ativo: { label: "Ativo", variant: "success", icon: CheckCircle2 },
  inativo: { label: "Inativo", variant: "neutral", icon: PauseCircle },
}

export const EHS_DOCUMENTO_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  valido: { label: "Válido", variant: "success", icon: CheckCircle2 },
  vencido: { label: "Vencido", variant: "destructive", icon: AlertTriangle },
  substituido: { label: "Substituído", variant: "neutral", icon: Archive },
  rejeitado: { label: "Rejeitado", variant: "destructive", icon: XCircle },
}

export const EHS_INTEGRACAO_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  agendado: { label: "Agendado", variant: "neutral", icon: Clock },
  confirmado: { label: "Confirmado", variant: "info", icon: CheckCircle2 },
  compareceu: { label: "Compareceu", variant: "success", icon: CheckCircle2 },
  nao_compareceu: { label: "Não compareceu", variant: "destructive", icon: XCircle },
  reagendado: { label: "Reagendado", variant: "warning", icon: Clock },
  cancelado: { label: "Cancelado", variant: "neutral", icon: Ban },
  concluido: { label: "Concluído", variant: "success", icon: FileCheck },
  vencido: { label: "Vencido", variant: "destructive", icon: AlertTriangle },
}

export type StatusEntity = "contrato" | "pedido" | "empresa" | "nota_fiscal" | "ehs_cliente" | "ehs_documento" | "ehs_integracao"

const CONFIG_BY_ENTITY: Record<StatusEntity, Record<string, StatusConfigEntry>> = {
  contrato: CONTRATO_STATUS_CONFIG,
  pedido: PEDIDO_STATUS_CONFIG,
  empresa: EMPRESA_STATUS_CONFIG,
  nota_fiscal: NOTA_FISCAL_STATUS_CONFIG,
  ehs_cliente: EHS_CLIENTE_STATUS_CONFIG,
  ehs_documento: EHS_DOCUMENTO_STATUS_CONFIG,
  ehs_integracao: EHS_INTEGRACAO_STATUS_CONFIG,
}

export function getStatusConfig(entity: StatusEntity, status: string): StatusConfigEntry {
  return CONFIG_BY_ENTITY[entity][status] || { label: status, variant: "neutral", icon: Clock }
}
