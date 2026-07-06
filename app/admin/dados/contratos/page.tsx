import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { listarContratosAdmin } from "@/app/actions/admin-dados"
import { listarEmpresas } from "@/app/actions/empresas"
import { ContratosAdminList } from "@/components/admin/contratos-admin-list"

export default async function AdminContratosPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const [resultado, empresasList] = await Promise.all([listarContratosAdmin({}), listarEmpresas()])

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <ContratosAdminList
        registrosIniciais={resultado.registros as any}
        totalInicial={resultado.total}
        totalPaginasInicial={resultado.total_paginas}
        empresas={empresasList.map((e: any) => ({ id: e.id, nome: e.nome_fantasia || e.razao_social }))}
      />
    </div>
  )
}
