"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { situacaoExibicaoIntegracao } from "@/lib/ehs/integracoes"

interface IntegracaoEhsResumo {
  id: string
  status: string
  data_agendada: string
  horario: string | null
  data_validade: string | null
  cliente?: { id: string; nome: string } | null
  colaborador?: { id: string; nome_completo: string; foto_url: string | null } | null
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function IntegracoesEhsList({ integracoes }: { integracoes: IntegracaoEhsResumo[] }) {
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("todos")

  const filtradas = integracoes.filter((i) => {
    const situacao = situacaoExibicaoIntegracao(i)
    if (status !== "todos" && situacao !== status) return false
    const alvo = `${i.cliente?.nome || ""} ${i.colaborador?.nome_completo || ""}`.toLowerCase()
    return alvo.includes(busca.toLowerCase())
  })

  if (integracoes.length === 0) {
    return <EmptyState icon={CalendarClock} title="Nenhuma integração agendada" description="Agende a primeira integração para conectar um cliente a um prestador." className="py-16" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou prestador..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="agendado">Agendado</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="compareceu">Compareceu</SelectItem>
            <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
            <SelectItem value="reagendado">Reagendado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState icon={Search} title="Nenhuma integração encontrada" description="Ajuste os filtros e tente novamente." className="py-16" />
      ) : (
        <div className="space-y-2">
          {filtradas.map((integracao) => (
            <Link key={integracao.id} href={`/ehs/integracoes/${integracao.id}`}>
              <Card className="p-4 flex flex-wrap items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {integracao.cliente?.nome || "Cliente"} · {integracao.colaborador?.nome_completo || "Prestador"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatarData(integracao.data_agendada)}
                    {integracao.horario ? ` às ${integracao.horario}` : ""}
                  </p>
                </div>
                <StatusBadge entity="ehs_integracao" status={situacaoExibicaoIntegracao(integracao)} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
