"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, FileSignature, User } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { FiscalFocusNfeForm } from "@/components/fiscal-focus-nfe-form"

interface SituacaoVigencia {
  chave: string
  label: string
  cor: "verde" | "amarelo" | "laranja" | "vermelho" | "cinza"
  emoji: string
  diasRestantes: number | null
  percentualDecorrido: number | null
}

interface ContratoResumo {
  id: string
  numero: string
  tipo_servico: string
  valor: number
  status: string
  versao_atual: number
  data_inicio: string
  data_termino?: string | null
  enviado_em?: string | null
  assinado_em?: string | null
  situacao_vigencia?: SituacaoVigencia
  aditivos?: Array<{ id: string; tipo: string; versao: number; status: string; created_at: string }>
}

interface ColaboradorProfileTabsProps {
  colaborador: {
    id: string
    nome_completo: string
    email: string
    cnpj: string
    tipo_acesso: string
    salario?: number | null
    equipe?: { id: string; nome: string } | null
    centro_custo?: { id: string; nome: string } | null
    focus_status_cadastro?: string | null
    focus_motivo_erro_cadastro?: string | null
    inscricao_municipal?: string | null
    regime_tributario?: string | null
  }
  contratos: ContratoResumo[]
}

const VIGENCIA_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  verde: "success",
  amarelo: "warning",
  laranja: "warning",
  vermelho: "destructive",
  cinza: "outline",
}

function formatarData(data?: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function ColaboradorProfileTabs({ colaborador, contratos }: ColaboradorProfileTabsProps) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/cadastros/colaboradores" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />
          Prestadores
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{colaborador.nome_completo}</h1>
            <p className="text-sm text-muted-foreground">{colaborador.email}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="contratos">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="contratos">Contratos ({contratos.length})</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-4 mt-4">
          <div className="rounded-md border p-4 grid gap-3 sm:grid-cols-2">
            <p className="text-sm"><span className="text-muted-foreground">CNPJ: </span>{colaborador.cnpj}</p>
            <p className="text-sm"><span className="text-muted-foreground">Tipo de acesso: </span>{colaborador.tipo_acesso}</p>
            <p className="text-sm"><span className="text-muted-foreground">Equipe: </span>{colaborador.equipe?.nome || "Sem equipe"}</p>
            <p className="text-sm"><span className="text-muted-foreground">Centro de custo: </span>{colaborador.centro_custo?.nome || "—"}</p>
            {colaborador.salario != null && (
              <p className="text-sm"><span className="text-muted-foreground">Valor contratual: </span>{formatCurrency(colaborador.salario)}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contratos" className="space-y-3 mt-4">
          {contratos.length === 0 ? (
            <EmptyState icon={FileSignature} title="Nenhum contrato vinculado a este prestador ainda" />
          ) : (
            contratos.map((contrato) => {
              return (
                <Link
                  key={contrato.id}
                  href={`/contratos/${contrato.id}`}
                  className="block rounded-md border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{contrato.numero}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{contrato.tipo_servico} · {formatCurrency(contrato.valor)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <StatusBadge entity="contrato" status={contrato.status} />
                      {contrato.situacao_vigencia && contrato.situacao_vigencia.chave !== "sem_vigencia" && (
                        <Badge variant={VIGENCIA_VARIANT[contrato.situacao_vigencia.cor]}>
                          {contrato.situacao_vigencia.emoji} {contrato.situacao_vigencia.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                    <span>Versão {contrato.versao_atual}</span>
                    <span>Início: {formatarData(contrato.data_inicio)}</span>
                    {contrato.data_termino && <span>Término: {formatarData(contrato.data_termino)}</span>}
                    {contrato.assinado_em && <span>Assinado em: {formatarData(contrato.assinado_em)}</span>}
                  </div>
                  {contrato.aditivos && contrato.aditivos.length > 0 && (
                    <div className="mt-2 pt-2 border-t flex flex-wrap gap-1.5">
                      {contrato.aditivos.map((aditivo) => (
                        <Badge key={aditivo.id} variant="outline" className="text-xs">
                          Aditivo v{aditivo.versao} · {aditivo.tipo}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="fiscal" className="mt-4 max-w-lg">
          <FiscalFocusNfeForm
            colaboradorId={colaborador.id}
            focusStatusCadastro={colaborador.focus_status_cadastro || "nao_cadastrado"}
            focusMotivoErroCadastro={colaborador.focus_motivo_erro_cadastro}
            inscricaoMunicipalAtual={colaborador.inscricao_municipal}
            regimeTributarioAtual={colaborador.regime_tributario}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
