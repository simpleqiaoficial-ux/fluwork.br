"use client"

import { useState, useTransition } from "react"
import { getPapelLabel } from "@/lib/papel-labels"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Users, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { listarColaboradoresAdmin, getImpactoExclusaoColaborador } from "@/app/actions/admin-dados"
import { atualizarColaborador, deletarColaborador } from "@/app/actions/colaboradores"
import { EmptyState } from "@/components/ui/empty-state"

interface ColaboradorAdminRow {
  id: string
  nome_completo: string
  email: string
  cnpj: string | null
  tipo_acesso: string
  empresa_id: string | null
  empresa_nome?: string | null
  equipe_nome?: string | null
  created_at: string
}

interface ColaboradoresAdminListProps {
  registrosIniciais: ColaboradorAdminRow[]
  totalInicial: number
  totalPaginasInicial: number
  empresas: Array<{ id: string; nome: string }>
}

const TIPO_ACESSO_OPCOES = ["Colaborador", "Supervisor", "Gerente", "Financeiro", "Adm"]

function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function ColaboradoresAdminList({ registrosIniciais, totalInicial, totalPaginasInicial, empresas }: ColaboradoresAdminListProps) {
  const [registros, setRegistros] = useState(registrosIniciais)
  const [total, setTotal] = useState(totalInicial)
  const [totalPaginas, setTotalPaginas] = useState(totalPaginasInicial)
  const [page, setPage] = useState(1)
  const [empresaId, setEmpresaId] = useState("todas")
  const [busca, setBusca] = useState("")
  const [isPending, startTransition] = useTransition()

  const [editando, setEditando] = useState<ColaboradorAdminRow | null>(null)
  const [campoNome, setCampoNome] = useState("")
  const [campoEmail, setCampoEmail] = useState("")
  const [campoTipoAcesso, setCampoTipoAcesso] = useState("Colaborador")
  const [campoSenha, setCampoSenha] = useState("")
  const [salvando, setSalvando] = useState(false)

  const [excluindo, setExcluindo] = useState<ColaboradorAdminRow | null>(null)
  const [impacto, setImpacto] = useState<{ pedidos_pagamento: number; historico_reajustes: number; notas_fiscais: number; bloqueia_exclusao: boolean } | null>(null)
  const [carregandoImpacto, setCarregandoImpacto] = useState(false)
  const [excluindoConfirmado, setExcluindoConfirmado] = useState(false)

  const recarregar = (novaPage: number, overrides?: { empresaId?: string; busca?: string }) => {
    const filtro = {
      empresaId: (overrides?.empresaId ?? empresaId) === "todas" ? undefined : overrides?.empresaId ?? empresaId,
      busca: (overrides?.busca ?? busca) || undefined,
      page: novaPage,
    }
    startTransition(async () => {
      const resultado = await listarColaboradoresAdmin(filtro)
      setRegistros(resultado.registros as any)
      setTotal(resultado.total)
      setTotalPaginas(resultado.total_paginas)
      setPage(novaPage)
    })
  }

  const abrirEdicao = (registro: ColaboradorAdminRow) => {
    setEditando(registro)
    setCampoNome(registro.nome_completo)
    setCampoEmail(registro.email)
    setCampoTipoAcesso(registro.tipo_acesso)
    setCampoSenha("")
  }

  const salvarEdicao = async () => {
    if (!editando) return
    setSalvando(true)
    try {
      await atualizarColaborador(editando.id, {
        nome_completo: campoNome,
        email: campoEmail,
        tipo_acesso: campoTipoAcesso as any,
        ...(campoSenha ? { senha: campoSenha } : {}),
      })
      toast.success("Prestador atualizado")
      setEditando(null)
      recarregar(page)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar")
    } finally {
      setSalvando(false)
    }
  }

  const abrirExclusao = async (registro: ColaboradorAdminRow) => {
    setExcluindo(registro)
    setImpacto(null)
    setCarregandoImpacto(true)
    try {
      const resultado = await getImpactoExclusaoColaborador(registro.id)
      setImpacto(resultado)
    } finally {
      setCarregandoImpacto(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!excluindo) return
    setExcluindoConfirmado(true)
    try {
      await deletarColaborador(excluindo.id)
      toast.success("Prestador excluído")
      setExcluindo(null)
      recarregar(page)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir")
    } finally {
      setExcluindoConfirmado(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Prestadores (todas as empresas)</h1>
        <p className="text-sm text-muted-foreground mt-1">Espelho cross-empresa para suporte — edição de campos controlados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou CNPJ..."
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

      <p className="text-sm text-muted-foreground">{total} colaborador{total !== 1 ? "es" : ""}</p>

      {registros.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum prestador encontrado"
          description="Nenhum resultado para os filtros aplicados."
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Equipe</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{registro.nome_completo}</p>
                    <p className="text-xs text-muted-foreground">{registro.email}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{registro.empresa_nome || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getPapelLabel(registro.tipo_acesso)}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{registro.equipe_nome || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEdicao(registro)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => abrirExclusao(registro)}>
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

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome completo</Label>
              <Input id="edit-nome" value={campoNome} onChange={(e) => setCampoNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input id="edit-email" type="email" value={campoEmail} onChange={(e) => setCampoEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de acesso</Label>
              <Select value={campoTipoAcesso} onValueChange={setCampoTipoAcesso}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_ACESSO_OPCOES.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-senha">Nova senha (opcional)</Label>
              <Input id="edit-senha" type="password" placeholder="Deixe em branco pra manter a atual" value={campoSenha} onChange={(e) => setCampoSenha(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={salvarEdicao} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {excluindo?.nome_completo}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {carregandoImpacto ? (
                  <p>Verificando vínculos...</p>
                ) : impacto?.bloqueia_exclusao ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Este colaborador tem {impacto.pedidos_pagamento} pedido(s) de pagamento, {impacto.historico_reajustes} reajuste(s) e{" "}
                      {impacto.notas_fiscais} nota(s) fiscal(is) vinculados. A exclusão será bloqueada para preservar esse histórico.
                    </p>
                  </div>
                ) : (
                  <p>Esta ação não pode ser desfeita. Nenhum vínculo (pedido, reajuste, nota fiscal) foi encontrado.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindoConfirmado || carregandoImpacto || !!impacto?.bloqueia_exclusao}
              className={buttonVariants({ variant: "destructive" })}
            >
              {excluindoConfirmado ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
