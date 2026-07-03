"use client"

import type { PedidoPagamento } from "@/types/pedido"
import { AprovacaoItem } from "./aprovacao-item"
import { Card } from "@/components/ui/card"
import { FileX } from "lucide-react"

interface AprovacoesListProps {
  pedidos: PedidoPagamento[]
  tipoAcesso: string
}

export function AprovacoesList({ pedidos, tipoAcesso }: AprovacoesListProps) {
  if (pedidos.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <FileX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum pedido pendente</h3>
          <p className="text-muted-foreground">Não há pedidos aguardando aprovação no momento.</p>
        </div>
      </Card>
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
