"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Equipe } from "@/types/equipe"
import {
  atualizarEquipe,
  sincronizarGerentesEquipe,
  vincularColaboradorEquipe,
  removerColaboradorEquipe,
} from "@/app/actions/equipes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  ArrowLeft,
  Settings,
  UserPlus,
  UserMinus,
  UserCheck,
  Briefcase,
  UsersRound,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface EquipeDetailViewProps {
  equipe: Equipe
  membros: Array<{ id: string; nome_completo: string; tipo_acesso: string; email: string }>
  colaboradoresSemEquipe: Array<{ id: string; nome_completo: string; tipo_acesso: string; email: string }>
  supervisores: Array<{ id: string; nome_completo: string }>
  gerentes: Array<{ id: string; nome_completo: string }>
}

export function EquipeDetailView({
  equipe,
  membros,
  colaboradoresSemEquipe,
  supervisores,
  gerentes,
}: EquipeDetailViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  // Edit form state
  const [editNome, setEditNome] = useState(equipe.nome)
  const [editSupervisorId, setEditSupervisorId] = useState(equipe.supervisor?.id || "")
  const [editGerentesIds, setEditGerentesIds] = useState<string[]>(equipe.gerentes?.map((g) => g.id) || [])

  // Add member search
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSemEquipe = colaboradoresSemEquipe.filter(
    (c) =>
      c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMember = async (colaboradorId: string) => {
    setLoading(true)
    try {
      await vincularColaboradorEquipe(colaboradorId, equipe.id)
      toast.success("Prestador adicionado a equipe")
      setAddDialogOpen(false)
      router.refresh()
    } catch (err) {
      toast.error("Erro ao adicionar prestador")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!removeId) return
    setLoading(true)
    try {
      await removerColaboradorEquipe(removeId)
      toast.success("Prestador removido da equipe")
      setRemoveId(null)
      router.refresh()
    } catch (err) {
      toast.error("Erro ao remover prestador")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!editNome.trim()) {
      toast.error("Informe o nome da equipe")
      return
    }
    setLoading(true)
    try {
      await atualizarEquipe(equipe.id, {
        nome: editNome.trim(),
        supervisor_id: editSupervisorId || null,
      })
      await sincronizarGerentesEquipe(equipe.id, editGerentesIds)
      toast.success("Equipe atualizada")
      setEditDialogOpen(false)
      router.refresh()
    } catch (err) {
      toast.error("Erro ao atualizar equipe")
    } finally {
      setLoading(false)
    }
  }

  const toggleGerente = (id: string) => {
    setEditGerentesIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cadastros/equipes">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{equipe.nome}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {equipe.supervisor && (
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                {equipe.supervisor.nome_completo}
              </span>
            )}
            {equipe.gerentes && equipe.gerentes.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                {equipe.gerentes.map((g) => g.nome_completo.split(" ")[0]).join(", ")}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditDialogOpen(true)}>
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configurar</span>
        </Button>
      </div>

      {/* Members list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Membros</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{membros.length} prestador{membros.length !== 1 ? "es" : ""}</p>
          </div>
          <Button size="sm" className="gap-2" onClick={() => { setSearchTerm(""); setAddDialogOpen(true) }}>
            <UserPlus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {membros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <UsersRound className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum membro nesta equipe</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => { setSearchTerm(""); setAddDialogOpen(true) }}
              >
                <UserPlus className="h-4 w-4" />
                Adicionar primeiro membro
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {membros.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.nome_completo}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{m.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {m.tipo_acesso}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setRemoveId(m.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog adicionar membro */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {filteredSemEquipe.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchTerm ? "Nenhum prestador encontrado" : "Todos os prestadores já pertencem a uma equipe"}
                </p>
              ) : (
                filteredSemEquipe.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAddMember(c.id)}
                    disabled={loading}
                    className="w-full flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{c.nome_completo}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 ml-2 font-normal">
                      {c.tipo_acesso}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog configurar equipe */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome da Equipe</Label>
              <Input
                id="edit-nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-supervisor">Supervisor</Label>
              <select
                id="edit-supervisor"
                value={editSupervisorId}
                onChange={(e) => setEditSupervisorId(e.target.value)}
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
                        id={`g-edit-${g.id}`}
                        checked={editGerentesIds.includes(g.id)}
                        onCheckedChange={() => toggleGerente(g.id)}
                      />
                      <label htmlFor={`g-edit-${g.id}`} className="text-sm cursor-pointer">
                        {g.nome_completo}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert remover membro */}
      <AlertDialog open={!!removeId} onOpenChange={(open) => !open && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              O prestador será desvinculado desta equipe. Você poderá adicioná-lo novamente depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
