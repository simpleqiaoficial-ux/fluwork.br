"use client"

import { useMemo, useState } from "react"
import { LifeBuoy, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { TicketCard, type TicketSuporteResumo } from "@/components/support/ticket-card"
import { CHAMADO_STATUS_CONFIG } from "@/lib/status-config"

interface TicketListProps {
  tickets: TicketSuporteResumo[]
  mostrarSolicitante?: boolean
  mostrarEmpresa?: boolean
}

export function TicketList({ tickets, mostrarSolicitante, mostrarEmpresa }: TicketListProps) {
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("todos")

  const filtrados = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFiltro !== "todos" && t.status !== statusFiltro) return false
      if (!busca) return true
      const termo = busca.toLowerCase()
      return t.titulo.toLowerCase().includes(termo) || t.numero.toLowerCase().includes(termo)
    })
  }, [tickets, busca, statusFiltro])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou número..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(CHAMADO_STATUS_CONFIG).map(([valor, cfg]) => (
              <SelectItem key={valor} value={valor}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={tickets.length === 0 ? "Nenhum chamado por aqui" : "Nenhum chamado encontrado"}
          description={tickets.length === 0 ? "Quando um chamado for aberto, ele aparece aqui." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((t) => (
            <TicketCard key={t.id} ticket={t} mostrarSolicitante={mostrarSolicitante} mostrarEmpresa={mostrarEmpresa} />
          ))}
        </div>
      )}
    </div>
  )
}
