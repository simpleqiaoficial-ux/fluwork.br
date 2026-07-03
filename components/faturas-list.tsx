"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { MoreVertical, Download, Eye, Pencil, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { format, parseISO, isPast, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Fatura, StatusFatura } from "@/types/fatura"
import { updateFaturaStatus, deleteFatura } from "@/app/actions/faturas"
import { useToast } from "@/hooks/use-toast"
import { NovaFaturaDialog } from "./nova-fatura-dialog"
import { EditarFaturaDialog } from "./editar-fatura-dialog"
import { useSystemStatus } from "./system-status-provider"
import { SystemSuspendedDialog } from "./system-suspended-dialog"

interface ColaboradorSimples {
  id: string
  nome: string
  email: string
}

interface FaturasListProps {
  faturas: Fatura[]
  colaboradores: ColaboradorSimples[]
  isAdmin: boolean
  colaboradorId: string
  tipoAcesso: string
}

const statusConfig: Record<StatusFatura, { label: string; variant: "success" | "warning" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "warning" },
  pago: { label: "Pago", variant: "success" },
  vencido: { label: "Vencido", variant: "destructive" },
}

export function FaturasList({ faturas: initialFaturas, colaboradores, isAdmin, colaboradorId, tipoAcesso }: FaturasListProps) {
  const [faturas, setFaturas] = useState(initialFaturas)
  const tipoAcessoLower = tipoAcesso?.toLowerCase() || ""
  const isAdm = tipoAcessoLower === "adm"
  const isFinanceiro = tipoAcessoLower === "financeiro"
  const canManageFaturas = isAdm // Apenas Adm pode gerenciar faturas

  const { isSystemSuspended, suspensionReason } = useSystemStatus()
  const [suspendedDialogOpen, setSuspendedDialogOpen] = useState(false)

  // Apenas adm pode fazer acoes (financeiro nao acessa quando sistema suspenso)
  const canDoActions = isAdm
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faturaToDelete, setFaturaToDelete] = useState<string | null>(null)
  const [editingFatura, setEditingFatura] = useState<Fatura | null>(null)
  const { toast } = useToast()

  const handleStatusChange = async (id: string, newStatus: StatusFatura) => {
    setLoading(id)
    const result = await updateFaturaStatus(id, newStatus)

    if (result.success) {
      setFaturas(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
      toast({ title: "Status atualizado com sucesso" })
    } else {
      toast({ title: "Erro ao atualizar status", variant: "destructive" })
    }
    setLoading(null)
  }

  const handleDelete = async () => {
    if (!faturaToDelete) return

    setLoading(faturaToDelete)
    const result = await deleteFatura(faturaToDelete)

    if (result.success) {
      setFaturas(prev => prev.filter(f => f.id !== faturaToDelete))
      toast({ title: "Fatura excluída com sucesso" })
    } else {
      toast({ title: "Erro ao excluir fatura", variant: "destructive" })
    }
    setLoading(null)
    setDeleteDialogOpen(false)
    setFaturaToDelete(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const checkVencimento = (dataVencimento: string, status: StatusFatura) => {
    if (status === "pago") return status
    const vencimento = parseISO(dataVencimento)
    if (isPast(vencimento) && !isToday(vencimento)) return "vencido"
    return status
  }

  const addFatura = (fatura: Fatura) => {
    setFaturas(prev => [fatura, ...prev])
  }

  const updateFaturaInList = (updatedFatura: Fatura) => {
    setFaturas(prev => prev.map(f => f.id === updatedFatura.id ? updatedFatura : f))
  }

  const handleSuspendedAction = () => {
    setSuspendedDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {canManageFaturas && (
        <div className="flex justify-end">
          <NovaFaturaDialog
            colaboradores={colaboradores}
            criadorId={colaboradorId}
            onFaturaCreated={addFatura}
          />
        </div>
      )}

      <SystemSuspendedDialog
        open={suspendedDialogOpen}
        onOpenChange={setSuspendedDialogOpen}
        reason={suspensionReason}
      />

      {faturas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivo</TableHead>
                {canManageFaturas && <TableHead className="w-8" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {faturas.map((fatura) => {
                const realStatus = checkVencimento(fatura.data_vencimento, fatura.status)
                const config = statusConfig[realStatus]

                return (
                  <TableRow key={fatura.id}>
                    <TableCell>
                      <div className="font-medium">{fatura.titulo}</div>
                      {fatura.descricao && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{fatura.descricao}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">{formatCurrency(fatura.valor)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {fatura.arquivo_pdf_url ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={fatura.arquivo_pdf_url} target="_blank" rel="noopener noreferrer" title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={fatura.arquivo_pdf_url} download title="Baixar">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {canManageFaturas && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingFatura(fatura)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(fatura.id, "pendente")}
                              disabled={loading === fatura.id}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Marcar como Pendente
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(fatura.id, "pago")}
                              disabled={loading === fatura.id}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(fatura.id, "vencido")}
                              disabled={loading === fatura.id}
                            >
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Marcar como Vencido
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setFaturaToDelete(fatura.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingFatura && (
        <EditarFaturaDialog
          fatura={editingFatura}
          colaboradores={colaboradores}
          open={!!editingFatura}
          onOpenChange={(open) => !open && setEditingFatura(null)}
          onFaturaUpdated={updateFaturaInList}
        />
      )}
    </div>
  )
}
