"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Power, PowerOff, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getSystemStatus, suspendSystem, reactivateSystem, type SystemStatus } from "@/app/actions/system-status"

export function SystemControl() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState("")

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setIsLoading(true)
    const result = await getSystemStatus()
    if (result.success && result.data) {
      setStatus(result.data)
    }
    setIsLoading(false)
  }

  const handleSuspend = async () => {
    if (!suspensionReason.trim() || suspensionReason.length < 5) {
      toast.error("Informe um motivo valido (minimo 5 caracteres)")
      return
    }

    setIsSubmitting(true)
    const result = await suspendSystem(suspensionReason)
    
    if (result.success) {
      toast.success("Sistema suspenso com sucesso")
      setSuspensionReason("")
      setShowSuspendDialog(false)
      loadStatus()
    } else {
      toast.error(result.error || "Erro ao suspender o sistema")
    }
    setIsSubmitting(false)
  }

  const handleReactivate = async () => {
    setIsSubmitting(true)
    const result = await reactivateSystem()
    
    if (result.success) {
      toast.success("Sistema reativado com sucesso")
      setShowReactivateDialog(false)
      loadStatus()
    } else {
      toast.error(result.error || "Erro ao reativar o sistema")
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const isActive = status?.is_active ?? true

  return (
    <>
      <Card className={isActive ? "border-green-500/30" : "border-red-500/30"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive ? (
                <div className="p-2 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">Controle do Sistema</CardTitle>
                <CardDescription>
                  Gerencie o status de funcionamento do FluxoPay
                </CardDescription>
              </div>
            </div>
            <Badge variant={isActive ? "default" : "destructive"} className="text-sm">
              {isActive ? "ATIVO" : "SUSPENSO"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isActive && status?.suspended_reason && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium text-red-400 mb-1">Motivo da Suspensao:</p>
              <p className="text-sm text-red-300">{status.suspended_reason}</p>
              {status.suspended_at && (
                <p className="text-xs text-red-400/70 mt-2">
                  Suspenso em: {new Date(status.suspended_at).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShowReactivateDialog(true)
                  } else {
                    setShowSuspendDialog(true)
                  }
                }}
              />
              <span className="text-sm font-medium">
                {isActive ? "Sistema em funcionamento" : "Sistema suspenso"}
              </span>
            </div>

            {isActive ? (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowSuspendDialog(true)}
              >
                <PowerOff className="h-4 w-4 mr-2" />
                Suspender Sistema
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowReactivateDialog(true)}
              >
                <Power className="h-4 w-4 mr-2" />
                Reativar Sistema
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Suspensao */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Suspender Sistema
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao suspender o sistema, todos os usuarios (exceto administradores) verao uma mensagem de manutencao e nao poderao acessar as funcionalidades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-4">
            <Label htmlFor="reason">Motivo da Suspensao *</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Manutencao programada, atualizacao do sistema..."
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Este motivo sera exibido para todos os usuarios.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={isSubmitting || !suspensionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suspendendo...
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Confirmar Suspensao
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Reativacao */}
      <AlertDialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-500">
              <Power className="h-5 w-5" />
              Reativar Sistema
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao reativar o sistema, todos os usuarios poderao acessar novamente as funcionalidades normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reativando...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Confirmar Reativacao
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
