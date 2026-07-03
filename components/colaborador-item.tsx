"use client"

import type { Colaborador } from "@/types/colaborador"
import { Button } from "@/components/ui/button"
import { Trash2, User, Pencil, EyeOff } from "lucide-react"
import { deletarColaborador } from "@/app/actions/colaboradores"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ColaboradorEditDialog } from "./colaborador-edit-dialog"
import { formatCurrency } from "@/lib/utils"
import { PasswordConfirmDialog } from "./password-confirm-dialog"

interface ColaboradorItemProps {
  colaborador: Colaborador
  usuarioLogadoTipoAcesso?: string
}

const getTipoAcessoVariant = (tipo: string) => {
  switch (tipo) {
    case "Adm":
      return "default"
    case "Financeiro":
      return "secondary"
    case "Gerente":
      return "outline"
    case "Supervisor":
      return "outline"
    default:
      return "outline"
  }
}

export function ColaboradorItem({ colaborador, usuarioLogadoTipoAcesso }: ColaboradorItemProps) {
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  const handleDelete = async () => {
    setPasswordDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setLoading(true)
    try {
      await deletarColaborador(colaborador.id)
    } catch (error) {
      console.error("[v0] Erro ao deletar:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao deletar prestador"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const salarioOculto = colaborador.salario === null || colaborador.salario === undefined
  // Financeiro não pode deletar nem editar perfil Adm
  const isFinanceiro = usuarioLogadoTipoAcesso === "Financeiro"
  const colaboradorEhAdm = colaborador.tipo_acesso === "Adm"
  const podeGerenciar = !(isFinanceiro && colaboradorEhAdm)

  return (
    <>
      <div className="flex items-center justify-between gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">{colaborador.nome_completo}</p>
              <Badge className="shrink-0" variant={getTipoAcessoVariant(colaborador.tipo_acesso)}>{colaborador.tipo_acesso}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{colaborador.email}</p>
            <p className="text-sm text-muted-foreground truncate">
              {salarioOculto ? (
                <span className="inline-flex items-center gap-1">
                  {"Valor contratual: "}<EyeOff className="w-3 h-3" />{" Confidencial"}
                </span>
              ) : (
                `Valor contratual: ${formatCurrency(colaborador.salario)}`
              )}{" "}
              {"• CNPJ: "}{colaborador.cnpj}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {podeGerenciar && (
            <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)}>
              <Pencil className="w-4 h-4 text-primary" />
            </Button>
          )}
          {podeGerenciar && (
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <ColaboradorEditDialog colaborador={colaborador} open={editDialogOpen} onOpenChange={setEditDialogOpen} usuarioLogadoTipoAcesso={usuarioLogadoTipoAcesso} />

      <PasswordConfirmDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão de Prestador"
        description={`Tem certeza que deseja excluir o prestador ${colaborador.nome_completo}? Esta ação não pode ser desfeita.`}
      />
    </>
  )
}
