"use client"

import type { Colaborador } from "@/types/colaborador"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Pencil, EyeOff, FileSignature } from "lucide-react"
import { deletarColaborador } from "@/app/actions/colaboradores"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ColaboradorEditDialog } from "./colaborador-edit-dialog"
import { formatCurrency } from "@/lib/utils"
import { PasswordConfirmDialog } from "./password-confirm-dialog"
import Link from "next/link"
import { getPapelLabel } from "@/lib/papel-labels"

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return (partes[0]?.[0] || "").concat(partes.length > 1 ? partes[partes.length - 1][0] : "").toUpperCase()
}

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
      <Card className="flex items-center justify-between gap-2 p-4 hover:bg-accent/40 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
            {iniciais(colaborador.nome_completo)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">{colaborador.nome_completo}</p>
              <Badge className="shrink-0" variant={getTipoAcessoVariant(colaborador.tipo_acesso)}>{getPapelLabel(colaborador.tipo_acesso)}</Badge>
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
          <Link href={`/cadastros/colaboradores/${colaborador.id}`}>
            <Button variant="ghost" size="icon" title="Ver contratos">
              <FileSignature className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Link>
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
      </Card>

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
