import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarAuditLog, listarAcoesDistintasAuditLog } from "@/app/actions/admin-logs"
import { listarEmpresas } from "@/app/actions/empresas"
import { AuditLogList } from "@/components/admin/audit-log-list"

export default async function AdminLogsPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const [resultado, acoes, empresasList] = await Promise.all([
    listarAuditLog({}),
    listarAcoesDistintasAuditLog(),
    listarEmpresas(),
  ])

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <AuditLogList
        registrosIniciais={resultado.registros as any}
        totalInicial={resultado.total}
        totalPaginasInicial={resultado.total_paginas}
        acoes={acoes}
        empresas={empresasList.map((e: any) => ({ id: e.id, nome: e.nome_fantasia || e.razao_social }))}
      />
    </div>
  )
}
