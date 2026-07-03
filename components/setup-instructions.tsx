import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SetupInstructions() {
  return (
    <div className="space-y-4 p-6 max-w-3xl mx-auto">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Configuração Necessária</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>Para que o sistema funcione corretamente, você precisa desabilitar a confirmação de email no Supabase:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Acesse o Dashboard do Supabase</li>
            <li>
              Vá em <strong>Authentication → Settings</strong>
            </li>
            <li>
              Em <strong>Email Auth</strong>, desabilite <strong>"Enable email confirmations"</strong>
            </li>
            <li>
              Clique em <strong>Save</strong>
            </li>
          </ol>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Abrir Dashboard do Supabase
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert variant="default" className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Alternativa Temporária</AlertTitle>
        <AlertDescription className="text-green-800 mt-2">
          <p>Se você já criou usuários e eles não conseguem fazer login, você pode confirmá-los manualmente:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
            <li>
              Vá em <strong>Authentication → Users</strong> no dashboard
            </li>
            <li>Clique no usuário que deseja confirmar</li>
            <li>
              Clique em <strong>"Confirm email"</strong>
            </li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
