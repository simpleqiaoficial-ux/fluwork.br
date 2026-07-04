import { getUsuarioLogado } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getDashboardGlobalStats } from "@/app/actions/empresas"
import { Building2, Users, UserCheck, FileSignature, CheckCircle2, Wallet, ShieldCheck, ShieldX } from "lucide-react"

export default async function AdminDashboardPage() {
  const usuario = await getUsuarioLogado()

  if (!usuario) redirect("/login")
  if (usuario.tipo_acesso !== "SuperAdmin") redirect("/")

  const stats = await getDashboardGlobalStats()

  const cards = [
    { label: "Empresas", valor: stats.total_empresas, icon: Building2 },
    { label: "Empresas ativas", valor: stats.empresas_ativas, icon: ShieldCheck },
    { label: "Empresas bloqueadas", valor: stats.empresas_bloqueadas, icon: ShieldX },
    { label: "Usuários", valor: stats.total_usuarios, icon: Users },
    { label: "Prestadores", valor: stats.total_prestadores, icon: UserCheck },
    { label: "Contratos enviados", valor: stats.total_contratos_enviados, icon: FileSignature },
    { label: "Contratos assinados", valor: stats.total_contratos_assinados, icon: CheckCircle2 },
    { label: "Pagamentos processados", valor: stats.total_pagamentos, icon: Wallet },
  ]

  return (
    <div className="container mx-auto px-4 lg:px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Painel FluWork</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão global de todas as empresas clientes da plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-md border p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums mt-2">{card.valor}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
