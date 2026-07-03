"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { AprovacaoItem } from "./aprovacao-item"

interface AprovacoesListProps {
  pedidos: PedidoPagamento[]
  tipoAcesso: string
}

export function AprovacoesList({ pedidos, tipoAcesso }: AprovacoesListProps) {
  if (pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-base font-semibold mb-1">Nenhum pedido pendente</h3>
        <p className="text-sm text-muted-foreground">Não há pedidos aguardando aprovação no momento.</p>
      </div>
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
