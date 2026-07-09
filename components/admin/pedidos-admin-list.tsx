"use client"

import { useState, useTransition } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Search, ChevronLeft, ChevronRight, Wallet, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { listarPedidosAdmin } from "@/app/actions/admin-dados"
import { deletarPedido } from "@/app/actions/pedidos"
import { EmptyState } from "@/components/ui/empty-state"

interface PedidoAdminRow {
  id: string
  valor_total: number
  status: string
  created_at: string
  empresa_id: string | null
  empresa_nome?: string | null
  colaborador_nome?: string | null
}

interface PedidosAdminListProps {
  registrosIniciais: PedidoAdminRow[]
  totalInicial: number
  totalPaginasInicial: number
  empresas: Array<{ id: string; nome: string }>
}

const STATUS_LABEL: Record<string, string> = {
  pendente_gerente: "Pendente (1º Aprovador)",
  pendente_financeiro: "Pendente (Aprovador Final)",
  aprovado: "Aprovado",
  recusado: "Recusado",
  correcao: "Em correção",
  pago: "Pago",
  aguardando_prorrogacao: "Aguardando prorrogação",
  prorrogacao_negada: "Prorrogação negada",
  nota_recebida: "Documento fiscal recebido",
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function PedidosAdminList({ registrosIniciais, totalInicial, totalPaginasInicial, empresas }: PedidosAdminListProps) {
  const [registros, setRegistros] = useState(registrosIniciais)
  const [total, setTotal] = useState(totalInicial)
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial)
  const [page, setPage] = useState(1)
  const [empresaId, setEmpresaId] = useState("todas")
  const [busca, setBusca] = useState("")
  const [isPending, startTransition] = useTransition()
  const [excluindo, setExcluindo] = useState<PedidoAdminRow | null>(null)
  const [processando, setProcessando] = useState(false)

  const recarregar = (novaPage: number, overrides?: { empresaId?: string; busca?: string }) => {
    const filtro = {
      empresaId: (overrides?.empresaId ?? empresaId) === "todas" ? undefined : overrides?.empresaId ?? empresaId,
      busca: (overrides?.busca ?? busca) || undefined,
      page: novaPage,
    }
    startTransition(async () => {
      const resultado = await listarPedidosAdmin(filtro)
      setRegistros(resultado.registros as any)
      setTotal(resultado.total)
      setTotalPaginas(resultado.total_paginas)
      setPage(novaPage)
    })
  }

  const confirmarExclusao = async () => {
    if (!excluindo) return
    setProcessando(true)
    try {
      await deletarPedido(excluindo.id)
      toast.success("Ordem de pagamento excluída")
      setExcluindo(null)
      recarregar(page)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir")
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Ordens de pagamento (todas as empresas)</h1>
        <p className="text-sm text-muted-foreground mt-1">Espelho cross-empresa — só leitura e exclusão (status é regido pelo fluxo de aprovação)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do prestador..."
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

      <p className="text-sm text-muted-foreground">{total} pedido{total !== 1 ? "s" : ""}</p>

      {registros.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nenhuma ordem encontrada"
          description="Nenhum resultado para os filtros aplicados."
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="w-[70px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="text-sm">{registro.colaborador_nome || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{registro.empresa_nome || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{formatarMoeda(registro.valor_total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABEL[registro.status] || registro.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatarData(registro.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setExcluindo(registro)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
            <AlertDialogTitle>Excluir esta ordem de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se houver nota fiscal vinculada, a exclusão será bloqueada.
            </AlertDialogDescription>
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
