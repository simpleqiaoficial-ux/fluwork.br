"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface PasswordConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
}

const SENHA_EXCLUSAO = "Connect123@"

export function PasswordConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmar Exclusão",
  description = "Esta ação é irreversível. Digite a senha de confirmação para continuar.",
}: PasswordConfirmDialogProps) {
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")

  const handleConfirm = () => {
    if (senha !== SENHA_EXCLUSAO) {
      setErro("Senha incorreta")
      return
    }

    setErro("")
    setSenha("")
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSenha("")
    setErro("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="senha">Senha de Confirmação</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                setErro("")
              }}
              placeholder="Digite a senha"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm()
                }
              }}
            />
            {erro && <p className="mt-1 text-sm text-destructive">{erro}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} variant="destructive" className="flex-1">
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
