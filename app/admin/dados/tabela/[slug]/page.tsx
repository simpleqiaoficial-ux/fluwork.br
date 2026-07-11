import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getUsuarioLogado } from "@/lib/auth-utils"
import { encontrarTabelaPorSlug } from "@/lib/admin/tabelas-registry"
import { buscarDadosTabela } from "@/lib/admin/tabela-dados"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronLeft, ChevronRight, EyeOff } from "lucide-react"

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—"
  if (valor instanceof Date) return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(valor)
  if (typeof valor === "boolean") return valor ? "Sim" : "Não"
  if (typeof valor === "object") return JSON.stringify(valor)
  return String(valor)
}

interface TabelaDetalhePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ pagina?: string }>
}

export default async function TabelaDetalhePage({ params, searchParams }: TabelaDetalhePageProps) {
  const usuario = await getUsuarioLogado()
  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const { slug } = await params
  const { pagina: paginaParam } = await searchParams
  const registro = encontrarTabelaPorSlug(slug)
  if (!registro) notFound()

  const pagina = Math.max(1, Number(paginaParam) || 1)
  const { colunas, linhas, total, porPagina } = await buscarDadosTabela(registro.table, pagina)
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  return (
    <div className="container mx-auto py-8 px-4 lg:px-6 max-w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/dados">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{registro.label}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {slug} · {total} registro{total === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {colunas.some((c) => c.redigida) && (
          <Badge variant="neutral" className="gap-1.5">
            <EyeOff className="h-3 w-3" />
            Campos de segurança ocultos
          </Badge>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {colunas.map((c) => (
                <th key={c.chave} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {c.nomeDb}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={colunas.length || 1} className="px-3 py-10 text-center text-muted-foreground">
                  Nenhum registro
                </td>
              </tr>
            ) : (
              linhas.map((linha, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  {colunas.map((c) => (
                    <td key={c.chave} className="px-3 py-2 whitespace-nowrap max-w-xs truncate" title={formatarValor(linha[c.chave])}>
                      {formatarValor(linha[c.chave])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Página {pagina} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          {pagina > 1 ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/admin/dados/tabela/${slug}?pagina=${pagina - 1}`}>
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" disabled>
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
          )}
          {pagina < totalPaginas ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/admin/dados/tabela/${slug}?pagina=${pagina + 1}`}>
                Próxima
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" disabled>
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
