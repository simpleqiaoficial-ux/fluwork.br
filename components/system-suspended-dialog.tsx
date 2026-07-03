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
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl">Sistema Suspenso</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base">
            O sistema esta temporariamente suspenso. Nenhuma acao pode ser realizada no momento. Entre em contato com o administrador.
          </AlertDialogDescription>
          {reason && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Motivo:</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{reason}</p>
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
