import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { NotasPeriodoList } from "@/components/notas-periodo-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const MESES_NOMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

async function listarNotasDoPeriodo(ano: number, mes: number) {
  const supabase = await getSupabaseServerClient()

  // Define o range de datas para o mes
  const dataInicio = new Date(ano, mes - 1, 1)
  const dataFim = new Date(ano, mes, 1)

  const { data, error } = await supabase
    .from("pedidos_pagamento")
    .select(`
      *,
      colaborador:colaboradores!colaborador_id (
        nome_completo, salario, tipo_acesso, equipe_id, cnpj
      ),
      notas_fiscais (
        id, numero_nfse, chave_acesso, valor_servico, cpf_cnpj_prestador,
        arquivo_xml_url, arquivo_pdf_url, created_at
      )
    `)
    .in("status", ["pendente_financeiro", "aprovado", "nota_recebida", "pago"])
    .gte("created_at", dataInicio.toISOString())
    .lt("created_at", dataFim.toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar notas do periodo:", error)
    return []
  }

  // Filtra apenas pedidos com nota fiscal ou reembolso KM
  return (data || []).filter((p) => {
    const hasNota =
      p.nota_fiscal_url ||
      (p.notas_fiscais &&
        ((Array.isArray(p.notas_fiscais) && p.notas_fiscais.length > 0) ||
          (!Array.isArray(p.notas_fiscais) && p.notas_fiscais)))
    const isReembolsoKm = p.tipo_pedido === "reembolso_km"
    return hasNota || isReembolsoKm
  })
}

export default async function NotasPeriodoPage({
  params,
}: {
  params: Promise<{ periodo: string }>
}) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  if (!["Financeiro", "Adm"].includes(usuario.tipo_acesso)) {
    redirect("/")
  }

  const { periodo } = await params
  const [anoStr, mesStr] = periodo.split("-")
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr)

  if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
    redirect("/notas")
  }

  const notas = await listarNotasDoPeriodo(ano, mes)
  const mesNome = MESES_NOMES[mes - 1]

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/notas">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para meses
          </Button>
        </Link>

        <h1 className="text-2xl font-semibold mb-1 text-foreground">
          {mesNome} {ano}
        </h1>
        <p className="text-sm text-muted-foreground">
          {notas.length} {notas.length === 1 ? "nota fiscal encontrada" : "notas fiscais encontradas"}
        </p>
      </div>

      <NotasPeriodoList pedidos={notas} />
    </div>
  )
}
