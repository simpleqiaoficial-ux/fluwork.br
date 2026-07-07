"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { AprovacaoItem } from "./aprovacao-item"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckCircle2 } from "lucide-react"

interface AprovacoesListProps {
  pedidos: PedidoPagamento[]
  tipoAcesso: string
}

export function AprovacoesList({ pedidos, tipoAcesso }: AprovacoesListProps) {
  if (pedidos.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Nenhum pedido pendente"
        description="Não há pedidos aguardando aprovação no momento."
      />
    )
  }

  return (
    <div className="space-y-4">
      {pedidos.map((pedido) => (
        <AprovacaoItem key={pedido.id} pedido={pedido} tipoAcesso={tipoAcesso} />
      ))}
    </div>
  )
}
