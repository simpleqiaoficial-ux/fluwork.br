"use client"

import { useEffect, useState } from "react"
import { listarColaboradores, exportarColaboradoresExcel } from "@/app/actions/colaboradores"
import { listarEquipes } from "@/app/actions/equipes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColaboradorItem } from "./colaborador-item"
import type { Colaborador } from "@/types/colaborador"
import type { Equipe } from "@/types/equipe"
import { Users, Search, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ITEMS_PER_PAGE = 5

interface ColaboradoresListProps {
  usuarioLogadoTipoAcesso?: string
}

export function ColaboradoresList({ usuarioLogadoTipoAcesso }: ColaboradoresListProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [equipeSelecionada, setEquipeSelecionada] = useState<string>("todas")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function carregarDados() {
      try {
        const [colaboradoresData, equipesData] = await Promise.all([listarColaboradores(), listarEquipes()])
        setColaboradores(colaboradoresData)
        setEquipes(equipesData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }
    carregarDados()
  }, [])

  const handleExportarExcel = async () => {
    setExporting(true)
    try {
      const dados = await exportarColaboradoresExcel()

      // Converter dados para CSV (formato compatível com Excel)
      const headers = Object.keys(dados[0] || {})
      const csvContent = [
        headers.join(","),
        ...dados.map((row) =>
          headers
            .map((header) => {
              const value = row[header] || ""
              // Escapar valores que contenham vírgulas ou aspas
              return `"${String(value).replace(/"/g, '""')}"`
            })
            .join(","),
        ),
      ].join("\n")

      // Criar blob com BOM para UTF-8
      const BOM = "\uFEFF"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `colaboradores_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    const matchesEquipe =
      equipeSelecionada === "todas"
        ? true
        : equipeSelecionada === "sem-equipe"
          ? !c.equipe_id
          : c.equipe_id === equipeSelecionada

    const matchesSearch =
      searchTerm === "" ||
      c.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm)

    return matchesEquipe && matchesSearch
  })

  const totalPages = Math.ceil(colaboradoresFiltrados.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const colaboradoresPaginados = colaboradoresFiltrados.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [equipeSelecionada, searchTerm])

  const colaboradoresSemEquipe = colaboradores.filter((c) => !c.equipe_id)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Colaboradores Cadastrados</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Colaboradores Cadastrados</CardTitle>
            <CardDescription>
              {colaboradoresFiltrados.length} de {colaboradores.length} colaborador
              {colaboradores.length !== 1 ? "es" : ""}
            </CardDescription>
          </div>
          <Button onClick={handleExportarExcel} disabled={exporting || colaboradores.length === 0} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={equipeSelecionada} onValueChange={setEquipeSelecionada}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Equipes</SelectItem>
              {colaboradoresSemEquipe.length > 0 && (
                <SelectItem value="sem-equipe">Sem Equipe ({colaboradoresSemEquipe.length})</SelectItem>
              )}
              {equipes.map((equipe) => {
                const qtdColaboradores = colaboradores.filter((c) => c.equipe_id === equipe.id).length
                return (
                  <SelectItem key={equipe.id} value={equipe.id}>
                    {equipe.nome} ({qtdColaboradores})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {colaboradoresFiltrados.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm
              ? "Nenhum colaborador encontrado com este termo de busca"
              : equipeSelecionada === "todas"
                ? "Nenhum colaborador cadastrado ainda"
                : equipeSelecionada === "sem-equipe"
                  ? "Nenhum colaborador sem equipe"
                  : "Nenhum colaborador nesta equipe"}
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {colaboradoresPaginados.map((colaborador) => (
                <ColaboradorItem key={colaborador.id} colaborador={colaborador} usuarioLogadoTipoAcesso={usuarioLogadoTipoAcesso} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
