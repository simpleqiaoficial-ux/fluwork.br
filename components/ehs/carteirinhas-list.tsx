"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CreditCard, ExternalLink, Loader2, Power } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { alternarStatusCarteirinhaEhs } from "@/app/actions/ehs-carteirinhas"

interface CarteirinhaDTO {
  id: string
  titulo: string | null
  url: string
  status: string
  created_at: string | Date
  cliente?: { id: string; nome: string } | null
  colaborador?: { id: string; nome_completo: string } | null
}

interface CarteirinhasListProps {
  carteirinhas: CarteirinhaDTO[]
  mostrarPrestador?: boolean
  mostrarCliente?: boolean
  podeAlternarStatus?: boolean
}

function formatarData(data: string | Date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data))
}

export function CarteirinhasList({ carteirinhas, mostrarPrestador, mostrarCliente, podeAlternarStatus }: CarteirinhasListProps) {
  const router = useRouter()
  const [carregandoId, setCarregandoId] = useState<string | null>(null)

  const handleAlternar = async (id: string) => {
    setCarregandoId(id)
    try {
      const result = await alternarStatusCarteirinhaEhs(id)
      if (!result.success) {
        toast.error(result.error || "Erro ao atualizar carteirinha")
        return
      }
      toast.success(result.status === "ativa" ? "Carteirinha ativada" : "Carteirinha desativada")
      router.refresh()
    } finally {
      setCarregandoId(null)
    }
  }

  if (carteirinhas.length === 0) {
    return <EmptyState icon={CreditCard} title="Nenhuma carteirinha emitida" description="Carteirinhas digitais aparecem aqui assim que forem emitidas." className="py-10" />
  }

  return (
    <div className="space-y-2">
      {carteirinhas.map((carteirinha) => (
        <Card key={carteirinha.id} className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {carteirinha.titulo || "Carteirinha digital"}
              {mostrarPrestador && carteirinha.colaborador && ` · ${carteirinha.colaborador.nome_completo}`}
              {mostrarCliente && carteirinha.cliente && ` · ${carteirinha.cliente.nome}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Emitida em {formatarData(carteirinha.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={carteirinha.status === "ativa" ? "success" : "neutral"}>{carteirinha.status === "ativa" ? "Ativa" : "Inativa"}</Badge>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={carteirinha.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir
              </a>
            </Button>
            {podeAlternarStatus && (
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={carregandoId === carteirinha.id} onClick={() => handleAlternar(carteirinha.id)}>
                {carregandoId === carteirinha.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
