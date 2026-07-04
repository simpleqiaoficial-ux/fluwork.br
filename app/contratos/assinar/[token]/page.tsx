import { validarTokenAssinatura } from "@/app/actions/contratos-assinatura"
import { montarDadosContrato } from "@/lib/contracts/montar-dados-contrato"
import { ContratoPreview } from "@/components/contratos/contrato-preview"
import { ContratoAssinaturaForm } from "@/components/contratos/contrato-assinatura-form"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"

const MENSAGENS: Record<string, { icone: typeof AlertCircle; titulo: string; descricao: string }> = {
  invalido: {
    icone: AlertCircle,
    titulo: "Link inválido",
    descricao: "Este link de assinatura não existe ou já não é mais válido.",
  },
  expired: {
    icone: Clock,
    titulo: "Link expirado",
    descricao: "Este link de assinatura expirou. Entre em contato com quem enviou o contrato para solicitar um novo envio.",
  },
  refused: {
    icone: XCircle,
    titulo: "Contrato recusado",
    descricao: "Este contrato foi recusado e não está mais disponível para assinatura.",
  },
  cancelled: {
    icone: XCircle,
    titulo: "Contrato cancelado",
    descricao: "Este contrato foi cancelado pela empresa e não está mais disponível para assinatura.",
  },
}

export default async function AssinarContratoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const resultado = await validarTokenAssinatura(token)

  if (!resultado.ok) {
    const msg = MENSAGENS.invalido
    const Icon = msg.icone
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
        <div className="max-w-sm text-center space-y-3">
          <Icon className="h-8 w-8 text-muted-foreground mx-auto" />
          <h1 className="text-lg font-semibold">{msg.titulo}</h1>
          <p className="text-sm text-muted-foreground">{msg.descricao}</p>
        </div>
      </div>
    )
  }

  const { contrato, signatario } = resultado

  if (contrato.status !== "sent" && contrato.status !== "viewed") {
    if (contrato.status === "signed") {
      const dados = montarDadosContrato(contrato as any, contrato.empresa as any)
      return (
        <div className="min-h-screen bg-muted/30 py-10 px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="rounded-md border bg-card px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Contrato assinado</p>
                <p className="text-xs text-muted-foreground">
                  Assinado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(contrato.assinado_em))}.
                  Você recebeu a versão final em PDF por e-mail.
                </p>
              </div>
            </div>
            <ContratoPreview dados={dados} />
          </div>
        </div>
      )
    }

    const msg = MENSAGENS[contrato.status] || MENSAGENS.invalido
    const Icon = msg.icone
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
        <div className="max-w-sm text-center space-y-3">
          <Icon className="h-8 w-8 text-muted-foreground mx-auto" />
          <h1 className="text-lg font-semibold">{msg.titulo}</h1>
          <p className="text-sm text-muted-foreground">{msg.descricao}</p>
        </div>
      </div>
    )
  }

  const dados = montarDadosContrato(contrato as any, contrato.empresa as any)

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <ContratoPreview dados={dados} />
        <ContratoAssinaturaForm token={token} emailSignatario={signatario.email} />
      </div>
    </div>
  )
}
