"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronRight, FileSignature } from "lucide-react"
import { toast } from "sonner"

interface SituacaoVigencia {
  chave: string
  label: string
  cor: "verde" | "amarelo" | "laranja" | "vermelho" | "cinza"
  emoji: string
  diasRestantes: number | null
}

interface ContratoRow {
  id: string
  numero: string
  prestador_nome: string
  tipo_servico: string
  valor: number
  status: string
  enviado_em?: string | null
  assinado_em?: string | null
  situacao_vigencia?: SituacaoVigencia
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviado", variant: "outline" },
  viewed: { label: "Visualizado", variant: "warning" },
  signed: { label: "Assinado", variant: "success" },
  refused: { label: "Recusado", variant: "destructive" },
  expired: { label: "Link expirado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
  archived: { label: "Arquivado", variant: "secondary" },
}

const VIGENCIA_VARIANT: Record<SituacaoVigencia["cor"], "success" | "warning" | "destructive" | "outline"> = {
  verde: "success",
  amarelo: "warning",
  laranja: "warning",
  vermelho: "destructive",
  cinza: "outline",
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarData(data?: string | null): string {
  if (!data) return "—"
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

interface ContratosListProps {
  contratos: ContratoRow[]
  tipoAcesso?: string
}

export function ContratosList({ contratos, tipoAcesso }: ContratosListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const reenviar = async (id: string) => {
    setLoadingId(id)
    try {
      const { reenviarContrato } = await import("@/app/actions/contratos")
      const result = await reenviarContrato(id)
      if (result.success) {
        toast.success("Convite reenviado")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao reenviar")
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, envie e acompanhe contratos assinados eletronicamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tipoAcesso === "Adm" && (
            <Link href="/contratos/configuracoes">
              <Button size="sm" variant="outline">
                Configurações
              </Button>
            </Link>
          )}
          {tipoAcesso !== "SuperAdmin" && (
            <Link href="/contratos/novo">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo contrato
              </Button>
            </Link>
          )}
        </div>
      </div>

      {contratos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSignature className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">Nenhum contrato criado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crie um contrato e envie para o prestador assinar eletronicamente.
          </p>
          <Link href="/contratos/novo">
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar primeiro contrato
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo de serviço</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((contrato) => {
                const statusConfig = STATUS_CONFIG[contrato.status] || { label: contrato.status, variant: "outline" as const }
                const podeReenviar = ["sent", "viewed", "expired"].includes(contrato.status)
                return (
                  <TableRow key={contrato.id}>
                    <TableCell>
                      <Link href={`/contratos/${contrato.id}`} className="font-medium text-foreground hover:underline">
                        {contrato.numero}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{contrato.prestador_nome}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground">{contrato.tipo_servico}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">
                      {formatarMoeda(contrato.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        {contrato.situacao_vigencia && contrato.situacao_vigencia.chave !== "sem_vigencia" && (
                          <Badge variant={VIGENCIA_VARIANT[contrato.situacao_vigencia.cor]}>
                            {contrato.situacao_vigencia.emoji} {contrato.situacao_vigencia.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatarData(contrato.assinado_em || contrato.enviado_em)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {podeReenviar && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            disabled={loadingId === contrato.id}
                            onClick={() => reenviar(contrato.id)}
                          >
                            Reenviar
                          </Button>
                        )}
                        <Link href={`/contratos/${contrato.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
