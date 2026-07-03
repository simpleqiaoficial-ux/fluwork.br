"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CentroCusto } from "@/types/colaborador"
import { criarCentroCusto, editarCentroCusto, excluirCentroCusto } from "@/app/actions/centros-custo"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Hash, Building2 } from "lucide-react"
import { toast } from "sonner"

interface CentrosCustoListProps {
  centros: CentroCusto[]
}

export function CentrosCustoList({ centros }: CentrosCustoListProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [numero, setNumero] = useState("")
  const [nome, setNome] = useState("")
  const [loading, setLoading] = useState(false)

  const openNew = () => {
    setEditingCentro(null)
    setNumero("")
    setNome("")
    setDialogOpen(true)
  }

  const openEdit = (centro: CentroCusto) => {
    setEditingCentro(centro)
    setNumero(centro.numero)
    setNome(centro.nome)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!numero.trim() || !nome.trim()) {
      toast.error("Preencha todos os campos")
      return
    }
    setLoading(true)
    try {
      if (editingCentro) {
        await editarCentroCusto(editingCentro.id, { numero, nome })
        toast.success("Centro de custo atualizado")
      } else {
        await criarCentroCusto({ numero, nome })
        toast.success("Centro de custo criado")
      }
      setDialogOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      await excluirCentroCusto(deleteId)
      toast.success("Centro de custo excluido")
      setDeleteId(null)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Centros de Custo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os centros de custo da empresa
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Centro de Custo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {centros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <Building2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Nenhum centro de custo</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Crie centros de custo para organizar seus colaboradores por area.
              </p>
              <Button onClick={openNew} variant="outline" size="sm" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Criar primeiro centro de custo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Numero</TableHead>
                  <TableHead>Nome da Area</TableHead>
                  <TableHead className="w-[100px] text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centros.map((centro) => (
                  <TableRow key={centro.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{centro.numero}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{centro.nome}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(centro)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(centro.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCentro ? "Editar Centro de Custo" : "Novo Centro de Custo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="numero">Numero</Label>
              <Input
                id="numero"
                placeholder="Ex: 1001"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Area</Label>
              <Input
                id="nome"
                placeholder="Ex: Departamento Comercial"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : editingCentro ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert excluir */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir centro de custo?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao nao pode ser desfeita. Centros de custo com colaboradores vinculados nao podem ser excluidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
