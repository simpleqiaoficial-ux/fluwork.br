import { validarTokenAssinatura } from "@/app/actions/contratos-assinatura"
import { montarDadosContrato } from "@/lib/contracts/montar-dados-contrato"
import { montarDadosAditivo } from "@/lib/contracts/montar-dados-aditivo"
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

const MENSAGENS_ADITIVO: Record<string, { icone: typeof AlertCircle; titulo: string; descricao: string }> = {
  expired: {
    icone: Clock,
    titulo: "Link expirado",
    descricao: "Este link de assinatura expirou. Entre em contato com quem enviou o aditivo para solicitar um novo envio.",
  },
  refused: {
    icone: XCircle,
    titulo: "Aditivo recusado",
    descricao: "Este aditivo foi recusado e não está mais disponível para assinatura.",
  },
  cancelled: {
    icone: XCircle,
    titulo: "Aditivo cancelado",
    descricao: "Este aditivo foi cancelado pela empresa e não está mais disponível para assinatura.",
  },
}

function AditivoPreview({ dados }: { dados: import("@/lib/contracts/montar-dados-aditivo").DadosAditivo }) {
  return (
    <div className="rounded-md border bg-card p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dados.tipoLabel}</p>
        <h1 className="text-lg font-semibold text-foreground">Referente ao contrato nº {dados.numeroContrato}</h1>
        <p className="text-sm text-muted-foreground mt-1">Versão {dados.versao}</p>
      </div>

      {dados.descricao && <p className="text-sm">{dados.descricao}</p>}

      {dados.alteracoes.length > 0 && (
        <div className="rounded-md border divide-y">
          {dados.alteracoes.map((alteracao, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 px-4 py-2 text-sm">
              <span className="text-muted-foreground">{alteracao.campo}</span>
              <span className="text-muted-foreground line-through">{alteracao.de}</span>
              <span className="font-medium">{alteracao.para}</span>
            </div>
          ))}
        </div>
      )}

      {dados.assinatura && (
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          Assinado eletronicamente por {dados.assinatura.nome} em {dados.assinatura.dataHoraFormatada} · IP {dados.assinatura.ip}
        </div>
      )}
    </div>
  )
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

  const { contrato, signatario, precisa_definir_senha } = resultado

  if (resultado.tipo === "aditivo") {
    const { aditivo } = resultado
    const dadosAditivo = montarDadosAditivo(aditivo as any, contrato as any, contrato.empresa as any)

    if (aditivo.status === "signed") {
      return (
        <div className="min-h-screen bg-muted/30 py-10 px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="rounded-md border bg-card px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Aditivo assinado</p>
                <p className="text-xs text-muted-foreground">Você recebeu a versão final em PDF por e-mail.</p>
              </div>
            </div>
            <AditivoPreview dados={dadosAditivo} />
          </div>
        </div>
      )
    }

    if (aditivo.status !== "sent" && aditivo.status !== "viewed") {
      const msg = MENSAGENS_ADITIVO[aditivo.status] || MENSAGENS.invalido
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

    return (
      <div className="min-h-screen bg-muted/30 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <AditivoPreview dados={dadosAditivo} />
          <ContratoAssinaturaForm token={token} emailSignatario={signatario.email} precisaDefinirSenha={precisa_definir_senha} />
        </div>
      </div>
    )
  }

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
        <ContratoAssinaturaForm token={token} emailSignatario={signatario.email} precisaDefinirSenha={precisa_definir_senha} />
      </div>
    </div>
  )
}
