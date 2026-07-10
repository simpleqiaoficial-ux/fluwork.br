"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Building2, Plus, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ClienteEhsResumo {
  id: string
  nome: string
  razao_social: string | null
  cnpj: string | null
  endereco_cidade: string | null
  endereco_uf: string | null
  status: string
  prestadores_vinculados: number
}

export function ClientesEhsList({ clientes }: { clientes: ClienteEhsResumo[] }) {
  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("todos")

  const filtrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const matchStatus = statusFiltro === "todos" || cliente.status === statusFiltro
      if (!matchStatus) return false
      if (!busca) return true
      const termo = busca.toLowerCase()
      return (
        cliente.nome.toLowerCase().includes(termo) ||
        (cliente.razao_social || "").toLowerCase().includes(termo) ||
        (cliente.cnpj || "").includes(termo)
      )
    })
  }, [clientes, busca, statusFiltro])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, razão social ou CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild className="gap-1.5 shrink-0">
          <Link href="/ehs/clientes/novo">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={clientes.length === 0 ? "Nenhum cliente cadastrado ainda" : "Nenhum cliente encontrado"}
          description={clientes.length === 0 ? "Cadastre o primeiro cliente pra começar a vincular prestadores e integrações." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((cliente) => (
            <Link key={cliente.id} href={`/ehs/clientes/${cliente.id}`}>
              <Card className="h-full hover:bg-accent/40 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{cliente.nome}</p>
                      {cliente.razao_social && (
                        <p className="text-xs text-muted-foreground truncate">{cliente.razao_social}</p>
                      )}
                    </div>
                    <StatusBadge entity="ehs_cliente" status={cliente.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {cliente.prestadores_vinculados} prestador{cliente.prestadores_vinculados === 1 ? "" : "es"}
                    </span>
                    {cliente.endereco_cidade && (
                      <span>{cliente.endereco_cidade}{cliente.endereco_uf ? `/${cliente.endereco_uf}` : ""}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
