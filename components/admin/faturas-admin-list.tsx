"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { ChevronLeft, ChevronRight, Receipt, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { listarFaturasAdmin } from "@/app/actions/admin-dados"
import { updateFaturaStatus, deleteFatura } from "@/app/actions/faturas"

interface FaturaAdminRow {
  id: string
  titulo: string
  valor: number | null
  data_vencimento: string
  status: string
  empresa_id: string | null
  empresa_nome?: string | null
}

interface FaturasAdminListProps {
  registrosIniciais: FaturaAdminRow[]
  totalInicial: number
  totalPaginasInicial: number
  empresas: Array<{ id: string; nome: string }>
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "success" },
  vencido: { label: "Vencido", variant: "destructive" },
}

function formatarMoeda(valor: number | null): string {
  if (valor == null) return "—"
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function FaturasAdminList({ registrosIniciais, totalInicial, totalPaginasInicial, empresas }: FaturasAdminListProps) {
  const [registros, setRegistros] = useState(registrosIniciais)
  const [total, setTotal] = useState(totalInicial)
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial)
  const [page, setPage] = useState(1)
  const [empresaId, setEmpresaId] = useState("todas")
  const [isPending, startTransition] = useTransition()
  const [excluindo, setExcluindo] = useState<FaturaAdminRow | null>(null)
  const [processando, setProcessando] = useState(false)

  const recarregar = (novaPage: number, overrides?: { empresaId?: string }) => {
    const filtro = {
      empresaId: (overrides?.empresaId ?? empresaId) === "todas" ? undefined : overrides?.empresaId ?? empresaId,
      page: novaPage,
    }
    startTransition(async () => {
      const resultado = await listarFaturasAdmin(filtro)
      setRegistros(resultado.registros as any)
      setTotal(resultado.total)
      setTotalPaginas(resultado.total_paginas)
      setPage(novaPage)
    })
  }

  const alterarStatus = async (registro: FaturaAdminRow, status: string) => {
    const result = await updateFaturaStatus(registro.id, status as any)
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
      const result = await deleteFatura(excluindo.id)
      if (result.success) {
        toast.success("Fatura excluída")
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
        <h1 className="text-2xl font-semibold text-foreground">Faturas (todas as empresas)</h1>
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

      <p className="text-sm text-muted-foreground">{total} fatura{total !== 1 ? "s" : ""}</p>

      {registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada com estes filtros.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => {
                const statusConfig = STATUS_CONFIG[registro.status] || { label: registro.status, variant: "outline" as const }
                return (
                  <TableRow key={registro.id}>
                    <TableCell className="text-sm font-medium">{registro.titulo}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{registro.empresa_nome || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{formatarMoeda(registro.valor)}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatarData(registro.data_vencimento)}</TableCell>
                    <TableCell>
                      <Select value={registro.status} onValueChange={(v) => alterarStatus(registro, v)}>
                        <SelectTrigger className="h-8 w-[120px]">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
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
            <AlertDialogTitle>Excluir fatura "{excluindo?.titulo}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} disabled={processando} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processando ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
