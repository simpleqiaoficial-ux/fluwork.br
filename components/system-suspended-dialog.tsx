"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface SystemSuspendedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason?: string | null
}

export function SystemSuspendedDialog({ open, onOpenChange, reason }: SystemSuspendedDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <AlertDialogTitle>Sistema suspenso</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            O sistema está temporariamente suspenso. Nenhuma ação pode ser realizada no momento. Entre em contato
            com o administrador.
          </AlertDialogDescription>
          {reason && (
            <div className="border-l-2 border-destructive pl-4 py-1 mt-2">
              <p className="text-sm font-medium text-destructive">Motivo</p>
              <p className="text-sm text-muted-foreground mt-1">{reason}</p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Entendi</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
