"use client"

import { useState, useTransition } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
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
import { ChevronLeft, ChevronRight, FileText, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { listarNotasFiscaisAdmin } from "@/app/actions/admin-dados"
import { aprovarRejeitarNota, excluirNotaFiscalAdmin } from "@/app/actions/notas-fiscais"
import { EmptyState } from "@/components/ui/empty-state"

interface NotaFiscalAdminRow {
  id: string
  numero_nfse: string
  valor_servico: number | null
  competencia: string
  status: string
  empresa_id: string | null
  empresa_nome?: string | null
  colaborador_nome?: string | null
}

interface NotasFiscaisAdminListProps {
  registrosIniciais: NotaFiscalAdminRow[]
  totalInicial: number
  totalPaginasInicial: number
  empresas: Array<{ id: string; nome: string }>
}

function formatarMoeda(valor: number | null): string {
  if (valor == null) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

export function NotasFiscaisAdminList({ registrosIniciais, totalInicial, totalPaginasInicial, empresas }: NotasFiscaisAdminListProps) {
  const [registros, setRegistros] = useState(registrosIniciais)
  const [total, setTotal] = useState(totalInicial)
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial)
  const [page, setPage] = useState(1)
  const [empresaId, setEmpresaId] = useState("todas")
  const [isPending, startTransition] = useTransition()
  const [excluindo, setExcluindo] = useState<NotaFiscalAdminRow | null>(null)
  const [processando, setProcessando] = useState(false)

  const recarregar = (novaPage: number, overrides?: { empresaId?: string }) => {
    const filtro = {
      empresaId: (overrides?.empresaId ?? empresaId) === "todas" ? undefined : overrides?.empresaId ?? empresaId,
      page: novaPage,
    }
    startTransition(async () => {
      const resultado = await listarNotasFiscaisAdmin(filtro)
      setRegistros(resultado.registros as any)
      setTotal(resultado.total)
      setTotalPaginas(resultado.total_paginas)
      setPage(novaPage)
    })
  }

  const alterarStatus = async (registro: NotaFiscalAdminRow, status: "aprovado" | "rejeitado") => {
    const result = await aprovarRejeitarNota(registro.id, status)
    if (result.success) {
      toast.success("Status atualizado")
      recarregar(page)
    } else {
      toast.error(result.error || "Erro ao atualizar")
    }
  }

  const confirmarExclusao = async () => {
    if (!excluindo) return
    setProcessando(true)
    try {
      const result = await excluirNotaFiscalAdmin(excluindo.id)
      if (result.success) {
        toast.success("Nota fiscal excluída")
        setExcluindo(null)
        recarregar(page)
      } else {
        toast.error(result.error || "Erro ao excluir")
      }
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Notas fiscais (todas as empresas)</h1>
        <p className="text-sm text-muted-foreground mt-1">Espelho cross-empresa — edição de status e exclusão</p>
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

      <p className="text-sm text-muted-foreground">{total} nota{total !== 1 ? "s" : ""} fiscal{total !== 1 ? "is" : ""}</p>

      {registros.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma nota fiscal encontrada"
          description="Nenhum resultado para os filtros aplicados."
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº NFS-e</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="hidden md:table-cell">Competência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => {
                return (
                  <TableRow key={registro.id}>
                    <TableCell className="text-sm font-medium">{registro.numero_nfse}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{registro.empresa_nome || "—"}</TableCell>
                    <TableCell className="text-sm">{registro.colaborador_nome || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatarMoeda(registro.valor_servico)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{registro.competencia}</TableCell>
                    <TableCell>
                      <Select value={registro.status} onValueChange={(v) => alterarStatus(registro, v as "aprovado" | "rejeitado")}>
                        <SelectTrigger className="h-8 w-[120px]">
                          <StatusBadge entity="nota_fiscal" status={registro.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente" disabled>Pendente</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setExcluindo(registro)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota fiscal {excluindo?.numero_nfse}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} disabled={processando} className={buttonVariants({ variant: "destructive" })}>
              {processando ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
