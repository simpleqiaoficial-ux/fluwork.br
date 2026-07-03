"use client"

import { useEffect, useState } from "react"
import { listarColaboradores } from "@/app/actions/colaboradores"
import type { Colaborador } from "@/types/colaborador"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingUp, Search, History } from "lucide-react"
import { ReajusteDialog } from "@/components/reajuste-dialog"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function ColaboradoresFinanceiroList() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [reajusteDialogOpen, setReajusteDialogOpen] = useState(false)
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null)
  const [filtro, setFiltro] = useState("")

  useEffect(() => {
    carregarColaboradores()
  }, [])

  const carregarColaboradores = async () => {
    try {
      const data = await listarColaboradores()
      setColaboradores(data)
    } catch (error) {
      console.error("[v0] Erro ao carregar colaboradores:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReajusteClick = (colaborador: Colaborador) => {
    setColaboradorSelecionado(colaborador)
    setReajusteDialogOpen(true)
  }

  const handleReajusteSuccess = () => {
    carregarColaboradores()
    setReajusteDialogOpen(false)
  }

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    const termo = filtro.toLowerCase()
    return (
      c.nome_completo.toLowerCase().includes(termo) ||
      c.email.toLowerCase().includes(termo) ||
      (c.cnpj && c.cnpj.toLowerCase().includes(termo))
    )
  })

  if (loading) {
    return <div className="text-center py-8">Carregando colaboradores...</div>
  }

  return (
    <>
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CNPJ..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild variant="outline">
          <Link href="/gestao/reajustes">
            <History className="w-4 h-4 mr-2" />
            Ver Histórico
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead className="text-right">Salário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colaboradoresFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {filtro ? "Nenhum colaborador encontrado" : "Nenhum colaborador cadastrado"}
                </TableCell>
              </TableRow>
            ) : (
              colaboradoresFiltrados.map((colaborador) => (
                <TableRow key={colaborador.id}>
                  <TableCell className="font-medium">{colaborador.nome_completo}</TableCell>
                  <TableCell className="text-muted-foreground">{colaborador.email}</TableCell>
                  <TableCell className="text-muted-foreground">{colaborador.cnpj || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{colaborador.equipe?.nome || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(colaborador.salario)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleReajusteClick(colaborador)} size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Aplicar Reajuste
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {colaboradorSelecionado && (
        <ReajusteDialog
          open={reajusteDialogOpen}
          onOpenChange={setReajusteDialogOpen}
          colaborador={colaboradorSelecionado}
          onSuccess={handleReajusteSuccess}
        />
      )}
    </>
  )
}
