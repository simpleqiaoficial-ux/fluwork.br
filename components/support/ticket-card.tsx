"use client"

import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { getLabelCategoriaSuporte } from "@/lib/support/categorias"

const PRIORIDADE_LABEL: Record<string, string> = { baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica" }
const PRIORIDADE_COR: Record<string, string> = { baixa: "text-muted-foreground", media: "text-info", alta: "text-warning", critica: "text-destructive" }

export interface TicketSuporteResumo {
  id: string
  numero: string
  titulo: string
  categoria: string
  status: string
  prioridade: string
  nivel_suporte: string
  created_at: string
  updated_at: string
  criado_por?: { nome_completo: string } | null
  empresa?: { nome: string } | null
}

interface TicketCardProps {
  ticket: TicketSuporteResumo
  mostrarSolicitante?: boolean
  mostrarEmpresa?: boolean
  href?: string
}

export function TicketCard({ ticket, mostrarSolicitante, mostrarEmpresa, href }: TicketCardProps) {
  return (
    <Link href={href || `/suporte/${ticket.id}`}>
      <Card className="h-full hover:bg-accent/40 transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-mono">{ticket.numero}</p>
              <p className="font-medium text-sm truncate">{ticket.titulo}</p>
            </div>
            <StatusBadge entity="chamado" status={ticket.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{getLabelCategoriaSuporte(ticket.categoria)}</span>
            <span className={PRIORIDADE_COR[ticket.prioridade] || ""}>Prioridade {PRIORIDADE_LABEL[ticket.prioridade] || ticket.prioridade}</span>
            {mostrarSolicitante && ticket.criado_por && <span>{ticket.criado_por.nome_completo}</span>}
            {mostrarEmpresa && ticket.empresa && <span>{ticket.empresa.nome}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
