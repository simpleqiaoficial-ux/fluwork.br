"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, ChevronLeft, ChevronRight, FileSignature, Ban, Archive } from "lucide-react"
import { toast } from "sonner"
import { listarContratosAdmin } from "@/app/actions/admin-dados"
import { cancelarContrato, arquivarContrato } from "@/app/actions/contratos"
import { EmptyState } from "@/components/ui/empty-state"

interface SituacaoVigencia {
  chave: string
  label: string
  cor: "verde" | "amarelo" | "laranja" | "vermelho" | "cinza"
  emoji: string
}

interface ContratoAdminRow {
  id: string
  numero: string
  prestador_nome: string
  valor: number
  status: string
  empresa?: { razao_social: string; nome_fantasia?: string } | null
  situacao_vigencia?: SituacaoVigencia
}

interface ContratosAdminListProps {
  registrosIniciais: ContratoAdminRow[]
  totalInicial: number
  totalPaginasInicial: number
  empresas: Array<{ id: string; nome: string }>
}

const VIGENCIA_VARIANT: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  verde: "success",
  amarelo: "warning",
  laranja: "warning",
  vermelho: "destructive",
  cinza: "outline",
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

export function ContratosAdminList({ registrosIniciais, totalInicial, totalPaginasInicial, empresas }: ContratosAdminListProps) {
  const [registros, setRegistros] = useState(registrosIniciais)
  const [total, setTotal] = useState(totalInicial)
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial)
  const [page, setPage] = useState(1)
  const [empresaId, setEmpresaId] = useState("todas")
  const [busca, setBusca] = useState("")
  const [isPending, startTransition] = useTransition()
  const [cancelando, setCancelando] = useState<ContratoAdminRow | null>(null)
  const [processando, setProcessando] = useState<string | null>(null)

  const recarregar = (novaPage: number, overrides?: { empresaId?: string; busca?: string }) => {
    const filtro = {
      empresaId: (overrides?.empresaId ?? empresaId) === "todas" ? undefined : overrides?.empresaId ?? empresaId,
      busca: (overrides?.busca ?? busca) || undefined,
      page: novaPage,
    }
    startTransition(async () => {
      const resultado = await listarContratosAdmin(filtro)
      setRegistros(resultado.registros as any)
      setTotal(resultado.total)
      setTotalPaginas(resultado.total_paginas)
      setPage(novaPage)
    })
  }

  const confirmarCancelamento = async () => {
    if (!cancelando) return
    setProcessando(cancelando.id)
    try {
      const result = await cancelarContrato(cancelando.id)
      if (result.success) {
        toast.success("Contrato cancelado")
        setCancelando(null)
        recarregar(page)
      } else {
        toast.error(result.error || "Erro ao cancelar")
      }
    } finally {
      setProcessando(null)
    }
  }

  const arquivar = async (registro: ContratoAdminRow) => {
    setProcessando(registro.id)
    try {
      const result = await arquivarContrato(registro.id)
      if (result.success) {
        toast.success("Contrato arquivado")
        recarregar(page)
      } else {
        toast.error(result.error || "Erro ao arquivar")
      }
    } finally {
      setProcessando(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Contratos (todas as empresas)</h1>
        <p className="text-sm text-muted-foreground mt-1">Espelho cross-empresa — cancelar/arquivar reaproveita as mesmas ações do módulo de Contratos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, prestador ou CPF/CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onBlur={() => recarregar(1)}
            onKeyDown={(e) => e.key === "Enter" && recarregar(1)}
            className="pl-9"
          />
        </div>
        <Select
          value={empresaId}
          onValueChange={(v) => {
            setEmpresaId(v)
            recarregar(1, { empresaId: v })
          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{total} contrato{total !== 1 ? "s" : ""}</p>

      {registros.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato encontrado"
          description="Nenhum resultado para os filtros aplicados."
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => {
                const podeCancelar = !["signed", "cancelled", "archived"].includes(registro.status)
                const podeArquivar =
                  ["cancelled", "refused", "expired"].includes(registro.status) ||
                  (registro.status === "signed" && registro.situacao_vigencia?.chave === "vencido")
                return (
                  <TableRow key={registro.id}>
                    <TableCell>
                      <Link href={`/contratos/${registro.id}`} className="font-medium text-foreground hover:underline">
                        {registro.numero}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {registro.empresa?.nome_fantasia || registro.empresa?.razao_social || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{registro.prestador_nome}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">{formatarMoeda(registro.valor)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge entity="contrato" status={registro.status} />
                        {registro.situacao_vigencia && registro.situacao_vigencia.chave !== "sem_vigencia" && (
                          <Badge variant={VIGENCIA_VARIANT[registro.situacao_vigencia.cor]}>
                            {registro.situacao_vigencia.emoji} {registro.situacao_vigencia.label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {podeCancelar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={processando === registro.id}
                            onClick={() => setCancelando(registro)}
                            title="Cancelar"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {podeArquivar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={processando === registro.id}
                            onClick={() => arquivar(registro)}
                            title="Arquivar"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">Página {page} de {totalPaginas}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1 || isPending} onClick={() => recarregar(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPaginas || isPending} onClick={() => recarregar(page + 1)}>
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!cancelando} onOpenChange={(open) => !open && setCancelando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar contrato {cancelando?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              O link de assinatura do prestador deixará de funcionar. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarCancelamento}
              disabled={!!processando}
              className={buttonVariants({ variant: "destructive" })}
            >
              {processando ? "Cancelando..." : "Cancelar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
