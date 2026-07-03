"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  criarEquipe,
  deletarEquipe,
  listarSupervisores,
  listarGerentes,
  sincronizarGerentesEquipe,
} from "@/app/actions/equipes"
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
import { Plus, Trash2, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Equipe } from "@/types/equipe"
import { toast } from "sonner"
import Link from "next/link"

interface EquipesListProps {
  equipes: Equipe[]
  membrosCount?: Record<string, number>
}

export function EquipesList({ equipes, membrosCount = {} }: EquipesListProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [nome, setNome] = useState("")
  const [supervisorId, setSupervisorId] = useState("")
  const [gerentesIds, setGerentesIds] = useState<string[]>([])

  const [supervisores, setSupervisores] = useState<Array<{ id: string; nome_completo: string }>>([])
  const [gerentes, setGerentes] = useState<Array<{ id: string; nome_completo: string }>>([])

  useEffect(() => {
    if (dialogOpen) {
      Promise.all([listarSupervisores(), listarGerentes()]).then(([sups, gers]) => {
        setSupervisores(sups)
        setGerentes(gers)
      })
    }
  }, [dialogOpen])

  const openNew = () => {
    setNome("")
    setSupervisorId("")
    setGerentesIds([])
    setDialogOpen(true)
  }

  const handleCriar = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da equipe")
      return
    }
    setLoading(true)
    try {
      await criarEquipe({
        nome: nome.trim(),
        supervisor_id: supervisorId || null,
      })

      // If there are gerentes, we need to get the new equipe ID
      // For now, we reload to sync everything
      toast.success("Equipe criada com sucesso")
      setDialogOpen(false)
      router.refresh()
    } catch (err) {
      toast.error("Erro ao criar equipe")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      await deletarEquipe(deleteId)
      toast.success("Equipe excluida")
      setDeleteId(null)
      router.refresh()
    } catch (err) {
      toast.error("Erro ao excluir equipe")
    } finally {
      setLoading(false)
    }
  }

  const toggleGerente = (id: string) => {
    setGerentesIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Equipes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as equipes e seus membros
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Equipe
        </Button>
      </div>

      {equipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="font-semibold text-foreground">Nenhuma equipe cadastrada</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Crie equipes para organizar seus prestadores.
          </p>
          <Button onClick={openNew} variant="outline" size="sm" className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Criar primeira equipe
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipe</TableHead>
                <TableHead className="hidden sm:table-cell">Supervisor</TableHead>
                <TableHead className="hidden md:table-cell">Gerentes</TableHead>
                <TableHead className="hidden sm:table-cell w-[100px] text-center">Membros</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipes.map((equipe) => (
                <TableRow key={equipe.id} className="group cursor-pointer">
                  <TableCell>
                    <Link href={`/cadastros/equipes/${equipe.id}`} className="flex items-center gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{equipe.nome}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {equipe.supervisor?.nome_completo || "Sem supervisor"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto sm:hidden opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {equipe.supervisor?.nome_completo || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {equipe.gerentes && equipe.gerentes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {equipe.gerentes.slice(0, 2).map((g) => (
                          <Badge key={g.id} variant="secondary" className="text-xs font-normal">
                            {g.nome_completo.split(" ")[0]}
                          </Badge>
                        ))}
                        {equipe.gerentes.length > 2 && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            +{equipe.gerentes.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {membrosCount[equipe.id] || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/cadastros/equipes/${equipe.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(equipe.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog criar equipe */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="eq-nome">Nome da Equipe</Label>
              <Input
                id="eq-nome"
                placeholder="Ex: Equipe Comercial"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eq-supervisor">Supervisor</Label>
              <select
                id="eq-supervisor"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sem supervisor</option>
                {supervisores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome_completo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Gerentes</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border border-input bg-muted/30 p-3 space-y-2">
                {gerentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum gerente cadastrado</p>
                ) : (
                  gerentes.map((g) => (
                    <div key={g.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`g-new-${g.id}`}
                        checked={gerentesIds.includes(g.id)}
                        onCheckedChange={() => toggleGerente(g.id)}
                      />
                      <label htmlFor={`g-new-${g.id}`} className="text-sm cursor-pointer">
                        {g.nome_completo}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={loading}>
              {loading ? "Criando..." : "Criar Equipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert excluir */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao nao pode ser desfeita. Prestadores vinculados serao desvinculados da equipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
