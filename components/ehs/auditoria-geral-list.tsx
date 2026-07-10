"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AuditoriaGeralItem {
  id: string
  tabela: string
  tabela_label: string
  acao: string
  campo: string | null
  valor_antigo: string | null
  valor_novo: string | null
  ator_nome: string | null
  ip: string | null
  user_agent: string | null
  created_at: string | Date
  href: string | null
}

const ACAO_LABELS: Record<string, string> = { criado: "Criado", atualizado: "Atualizado", excluido: "Excluído" }

function formatarDataHora(data: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data))
}

export function AuditoriaGeralList({ eventos }: { eventos: AuditoriaGeralItem[] }) {
  const [tabelaFiltro, setTabelaFiltro] = useState("todas")
  const tabelas = Array.from(new Set(eventos.map((e) => e.tabela)))
  const filtrados = tabelaFiltro === "todas" ? eventos : eventos.filter((e) => e.tabela === tabelaFiltro)

  if (eventos.length === 0) {
    return <EmptyState icon={ShieldCheck} title="Nenhuma alteração registrada ainda" description="Toda mudança em clientes, prestadores, documentos e integrações aparece aqui." className="py-16" />
  }

  return (
    <div className="space-y-4">
      <Select value={tabelaFiltro} onValueChange={setTabelaFiltro}>
        <SelectTrigger className="w-[220px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as entidades</SelectItem>
          {tabelas.map((tabela) => (
            <SelectItem key={tabela} value={tabela}>
              {eventos.find((e) => e.tabela === tabela)?.tabela_label || tabela}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        {filtrados.map((evento) => (
          <Card key={evento.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="neutral">{evento.tabela_label}</Badge>
                  <p className="text-sm font-medium">
                    {ACAO_LABELS[evento.acao] || evento.acao}
                    {evento.campo && <span className="text-muted-foreground"> · {evento.campo}</span>}
                  </p>
                </div>
                {evento.campo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {evento.valor_antigo || "—"} → {evento.valor_novo || "—"}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {evento.ator_nome ? `por ${evento.ator_nome}` : "sistema"}
                  {evento.ip && ` · IP ${evento.ip}`}
                </p>
                {evento.user_agent && <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate max-w-md">{evento.user_agent}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatarDataHora(evento.created_at)}</span>
                {evento.href && (
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                    <Link href={evento.href}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
