"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/login-form"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Login embutido na própria landing page — clicar em "Fazer Login" abre este modal em vez
 *  de navegar para outra página, mesma lógica de autenticação do /login (LoginForm). */
export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Acesse sua conta</DialogTitle>
          <DialogDescription>Entre com suas credenciais para continuar</DialogDescription>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )
}
