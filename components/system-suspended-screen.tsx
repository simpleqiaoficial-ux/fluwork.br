"use client"

import { AlertTriangle, Mail, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SystemSuspendedScreenProps {
  reason?: string | null
}

export function SystemSuspendedScreen({ reason }: SystemSuspendedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <Card className="w-full max-w-lg bg-gray-800/50 border-red-500/30 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Sistema Temporariamente Suspenso</h1>
            <p className="text-gray-400">
              O FluxoPay esta em manutencao no momento.
            </p>
          </div>

          {reason && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
              <p className="text-sm font-medium text-red-400 mb-1">Motivo:</p>
              <p className="text-sm text-red-300">{reason}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700 space-y-3">
            <p className="text-sm text-gray-400">
              Em caso de duvidas, entre em contato:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a 
                href="mailto:simpleqia.oficial@gmail.com" 
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                simpleqia.oficial@gmail.com
              </a>
              <a 
                href="https://wa.me/5511914860806" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                (11) 91486-0806
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Agradecemos sua compreensao. O sistema voltara ao normal em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
