"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Search, History, ArrowLeft } from "lucide-react"
import { ReajusteDialog } from "@/components/reajuste-dialog"
import { listarColaboradores } from "@/app/actions/colaboradores"
import { listarHistoricoReajustes } from "@/app/actions/reajustes"
import type { Colaborador } from "@/types/colaborador"
import type { HistoricoReajuste } from "@/types/reajuste"
import Link from "next/link"

export function ReajustesPageContent() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [historico, setHistorico] = useState<HistoricoReajuste[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [reajusteDialogOpen, setReajusteDialogOpen] = useState(false)
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null)
  const [filtro, setFiltro] = useState("")
  const [filtroHistorico, setFiltroHistorico] = useState("")

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const [colabs, hist] = await Promise.all([
        listarColaboradores(),
        listarHistoricoReajustes()
      ])
      setColaboradores(colabs)
      setHistorico(hist)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
      setLoadingHistorico(false)
    }
  }

  const handleReajusteClick = (colaborador: Colaborador) => {
    setColaboradorSelecionado(colaborador)
    setReajusteDialogOpen(true)
  }

  const handleReajusteSuccess = () => {
    carregarDados()
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

  const historicoFiltrado = historico.filter((r) => {
    const termo = filtroHistorico.toLowerCase()
    return (
      r.colaborador?.nome_completo?.toLowerCase().includes(termo) ||
      r.motivo?.toLowerCase().includes(termo)
    )
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gestao">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Aplicar Reajustes</h1>
          <p className="text-sm text-muted-foreground">
            Aplique reajustes contratuais aos prestadores e consulte o histórico.
          </p>
        </div>
      </div>

      <Tabs defaultValue="aplicar" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="aplicar" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Aplicar Reajuste
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aplicar">
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando prestadores...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="text-right">Valor Contratual Atual</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colaboradoresFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {filtro ? "Nenhum prestador encontrado" : "Nenhum prestador cadastrado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    colaboradoresFiltrados.map((colaborador) => (
                      <TableRow key={colaborador.id}>
                        <TableCell className="font-medium">{colaborador.nome_completo}</TableCell>
                        <TableCell className="text-muted-foreground">{colaborador.email}</TableCell>
                        <TableCell className="text-muted-foreground">{colaborador.cnpj || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{colaborador.equipe?.nome || "-"}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(colaborador.salario)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button onClick={() => handleReajusteClick(colaborador)} size="sm">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Reajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por prestador ou motivo..."
                value={filtroHistorico}
                onChange={(e) => setFiltroHistorico(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            {loadingHistorico ? (
              <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Contratual Anterior</TableHead>
                    <TableHead className="text-right">Novo Valor Contratual</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Aplicado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoFiltrado.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {filtroHistorico ? "Nenhum reajuste encontrado" : "Nenhum reajuste registrado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    historicoFiltrado.map((reajuste) => (
                      <TableRow key={reajuste.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDate(reajuste.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {reajuste.colaborador?.nome_completo || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {reajuste.tipo_reajuste === "porcentagem"
                              ? `${reajuste.valor_reajuste}%`
                              : formatCurrency(reajuste.valor_reajuste)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {formatCurrency(reajuste.salario_anterior)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(reajuste.salario_novo)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {reajuste.motivo || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {reajuste.aplicador?.nome_completo || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {colaboradorSelecionado && (
        <ReajusteDialog
          open={reajusteDialogOpen}
          onOpenChange={setReajusteDialogOpen}
          colaborador={colaboradorSelecionado}
          onSuccess={handleReajusteSuccess}
        />
      )}
    </div>
  )
}
