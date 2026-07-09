import { Ban, Mail, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "@/components/logout-button"

interface EmpresaBloqueadaScreenProps {
  motivo?: string | null
}

export function EmpresaBloqueadaScreen({ motivo }: EmpresaBloqueadaScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Ban className="h-8 w-8 text-destructive" />
          <Badge variant="destructive">Acesso bloqueado</Badge>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">O acesso da sua empresa está bloqueado</h1>
          <p className="text-sm text-muted-foreground">
            Nenhuma ação pode ser realizada na plataforma no momento. Entre em contato com o suporte pra regularizar.
          </p>
        </div>

        {motivo && (
          <div className="border-l-2 border-destructive pl-4 py-1 text-left">
            <p className="text-sm font-medium text-destructive mb-1">Motivo</p>
            <p className="text-sm text-muted-foreground">{motivo}</p>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <p className="text-sm text-muted-foreground">Em caso de dúvidas, entre em contato:</p>
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

        <LogoutButton />
      </div>
    </div>
  )
}
