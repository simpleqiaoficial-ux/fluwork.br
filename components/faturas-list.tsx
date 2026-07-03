"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { FileText, MoreVertical, Download, Eye, Pencil, Trash2, Users, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react"
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

const statusConfig: Record<StatusFatura, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  pago: { label: "Pago", variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
  vencido: { label: "Vencido", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
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
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {faturas.map((fatura) => {
            const realStatus = checkVencimento(fatura.data_vencimento, fatura.status)
            const config = statusConfig[realStatus]
            
            return (
              <Card key={fatura.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  realStatus === "pago" ? "bg-green-500" : 
                  realStatus === "vencido" ? "bg-red-500" : "bg-yellow-500"
                }`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{fatura.titulo}</CardTitle>
                    {canManageFaturas && (
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
                    )}
                  </div>
                  <Badge variant={config.variant} className="w-fit gap-1">
                    {config.icon}
                    {config.label}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-lg">{formatCurrency(fatura.valor)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Vencimento: {format(parseISO(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {fatura.descricao && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="line-clamp-2">{fatura.descricao}</span>
                    </div>
                  )}
                  
                  {fatura.arquivo_pdf_url && (
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={fatura.arquivo_pdf_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={fatura.arquivo_pdf_url} download>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
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
