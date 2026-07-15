import { History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"

const ACAO_LABEL: Record<string, string> = {
  TICKET_CREATED: "Chamado criado",
  TICKET_VIEWED: "Chamado visualizado",
  TICKET_ASSIGNED: "Chamado atribuído",
  STATUS_CHANGED: "Status alterado",
  PRIORITY_CHANGED: "Prioridade alterada",
  MESSAGE_SENT: "Mensagem enviada",
  INTERNAL_NOTE_CREATED: "Nota interna criada",
  ATTACHMENT_UPLOADED: "Anexo enviado",
  TICKET_ESCALATED: "Chamado escalado",
  TICKET_RETURNED: "Chamado devolvido",
  TICKET_RESOLVED: "Chamado resolvido",
  TICKET_CLOSED: "Chamado fechado",
  TICKET_REOPENED: "Chamado reaberto",
  TICKET_ARCHIVED: "Chamado arquivado",
  DATA_ANONYMIZED: "Dados anonimizados",
  DATA_REMOVED: "Dados removidos",
}

interface AuditoriaSuporteDTO {
  id: string
  acao: string
  campo: string | null
  valor_antigo: string | null
  valor_novo: string | null
  created_at: string
  ator?: { nome_completo: string } | null
}

function formatarDataHora(data: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data))
}

export function TicketAuditTab({ registros }: { registros: AuditoriaSuporteDTO[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {registros.length === 0 ? (
          <EmptyState icon={History} title="Sem eventos de auditoria" className="py-8" />
        ) : (
          <div className="space-y-3">
            {registros.map((r) => (
              <div key={r.id} className="text-xs border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{ACAO_LABEL[r.acao] || r.acao}</span>
                  <span>{formatarDataHora(r.created_at)}</span>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {r.ator?.nome_completo || "Sistema"}
                  {r.campo && (r.valor_antigo || r.valor_novo) && (
                    <>
                      {" · "}
                      {r.campo}: {r.valor_antigo || "—"} → {r.valor_novo || "—"}
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
