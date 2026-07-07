"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listarColaboradores, exportarColaboradoresExcel } from "@/app/actions/colaboradores"
import { listarEquipes } from "@/app/actions/equipes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColaboradorItem } from "./colaborador-item"
import type { Colaborador } from "@/types/colaborador"
import type { Equipe } from "@/types/equipe"
import { Search, ChevronLeft, ChevronRight, Download, Plus, Users } from "lucide-react"
import { toast } from "sonner"

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
      const BOM = "﻿"
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `colaboradores_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Exportação concluída", {
        description: "Os dados foram exportados com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar", {
        description: "Não foi possível exportar os dados. Tente novamente.",
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
    return <p className="text-sm text-muted-foreground py-8">Carregando colaboradores...</p>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {colaboradoresFiltrados.length} de {colaboradores.length} prestador
          {colaboradores.length !== 1 ? "es" : ""}
        </p>
        <Button onClick={handleExportarExcel} disabled={exporting || colaboradores.length === 0} variant="outline">
          <Download className="h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar Excel"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={equipeSelecionada} onValueChange={setEquipeSelecionada}>
          <SelectTrigger className="w-full sm:w-[260px]">
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">
            {searchTerm
              ? "Nenhum prestador encontrado"
              : equipeSelecionada === "todas"
                ? "Nenhum prestador cadastrado ainda"
                : equipeSelecionada === "sem-equipe"
                  ? "Nenhum prestador sem equipe"
                  : "Nenhum prestador nesta equipe"}
          </h3>
          {!searchTerm && equipeSelecionada === "todas" && (
            <>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Cadastre o primeiro prestador de serviços da sua empresa.
              </p>
              <Link href="/cadastros/colaboradores/novo">
                <Button variant="outline" size="sm" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Prestador
                </Button>
              </Link>
            </>
          )}
        </div>
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
    </div>
  )
}
