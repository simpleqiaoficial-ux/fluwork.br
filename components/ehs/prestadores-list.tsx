"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, HardHat } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmptyState } from "@/components/ui/empty-state"
import type { ComplianceResultado } from "@/lib/ehs/compliance"

interface PrestadorEhsResumo {
  id: string
  nome_completo: string
  email: string | null
  foto_url: string | null
  compliance: ComplianceResultado
}

const COR_DOT: Record<ComplianceResultado["cor"], string> = {
  verde: "bg-success",
  amarelo: "bg-warning",
  vermelho: "bg-destructive",
  cinza: "bg-muted-foreground",
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase()
}

export function PrestadoresEhsList({ prestadores }: { prestadores: PrestadorEhsResumo[] }) {
  const [busca, setBusca] = useState("")

  const filtrados = prestadores.filter((p) => p.nome_completo.toLowerCase().includes(busca.toLowerCase()) || (p.email || "").toLowerCase().includes(busca.toLowerCase()))

  if (prestadores.length === 0) {
    return (
      <EmptyState
        icon={HardHat}
        title="Nenhum prestador cadastrado"
        description="Prestadores são os colaboradores já cadastrados no FluWork — cadastre um colaborador em Cadastros para que ele apareça aqui."
        className="py-16"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar prestador..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icon={Search} title="Nenhum prestador encontrado" description="Ajuste a busca e tente novamente." className="py-16" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((prestador) => (
            <Link key={prestador.id} href={`/ehs/prestadores/${prestador.id}`}>
              <Card className="p-4 flex items-center gap-3 hover:border-primary/40 transition-colors h-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={prestador.foto_url || undefined} alt={prestador.nome_completo} />
                  <AvatarFallback>{iniciais(prestador.nome_completo)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{prestador.nome_completo}</p>
                  <p className="text-xs text-muted-foreground truncate">{prestador.email || "Sem e-mail"}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`h-2 w-2 rounded-full ${COR_DOT[prestador.compliance.cor]}`} />
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">{prestador.compliance.score !== null ? `${prestador.compliance.score}%` : "—"}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
