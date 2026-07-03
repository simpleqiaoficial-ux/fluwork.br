"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, Receipt, CheckSquare, LogOut, UsersRound, Menu, X, AlertCircle, FileText } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface NavigationProps {
  tipoAcesso?: string
}

export function Navigation({ tipoAcesso }: NavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getLinks = () => {
    if (tipoAcesso === "Colaborador") {
      return [
        {
          href: "/meus-pagamentos",
          label: "Meus Pagamentos",
          icon: Receipt,
          roles: ["Colaborador"],
        },
      ]
    }

    if (tipoAcesso === "Supervisor") {
      return [
        { href: "/", label: "Dashboard", icon: Home, roles: ["Supervisor"] },
        { href: "/pedidos", label: "Criar Pedido", icon: Receipt, roles: ["Supervisor"] },
        { href: "/historico", label: "Meu Histórico", icon: CheckSquare, roles: ["Supervisor"] },
        { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt, roles: ["Supervisor"] },
        { href: "/supervisor/notas-equipe", label: "Notas da Equipe", icon: FileText, roles: ["Supervisor"] },
        { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle, roles: ["Supervisor"] },
      ]
    }

    const baseLinks = [
      {
        href: "/",
        label: "Dashboard",
        icon: Home,
        roles: ["Adm", "Gerente", "Financeiro"],
      },
    ]

    const allLinks = [
      ...baseLinks,
      { href: "/colaboradores", label: "Colaboradores", icon: Users, roles: ["Adm", "Financeiro"] },
      { href: "/equipes", label: "Equipes", icon: UsersRound, roles: ["Adm", "Financeiro"] },
      { href: "/pedidos", label: "Criar Pedido", icon: Receipt, roles: ["Adm", "Gerente"] },
      { href: "/aprovacoes", label: "Aprovações", icon: CheckSquare, roles: ["Adm", "Gerente", "Financeiro"] },
      {
        href: "/financeiro/colaboradores",
        label: "Gestão de Colaboradores",
        icon: Users,
        roles: ["Adm", "Financeiro"],
      },
      { href: "/financeiro", label: "Painel Financeiro", icon: Receipt, roles: ["Adm", "Financeiro"] },
      {
        href: "/meus-pagamentos",
        label: "Meus Pagamentos",
        icon: Receipt,
        roles: ["Gerente", "Financeiro"],
      },
      {
        href: "/acompanhamento",
        label: "Acompanhamento",
        icon: AlertCircle,
        roles: ["Adm", "Gerente", "Financeiro"],
      },
      {
        href: "/historico-completo",
        label: "Histórico Completo",
        icon: FileText,
        roles: ["Adm", "Gerente", "Financeiro"],
      },
    ]

    return allLinks.filter((link) => !tipoAcesso || link.roles.includes(tipoAcesso))
  }

  const links = getLinks()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-6">
          <Link href="/" className="font-semibold text-base">
            FluXork
          </Link>
          <div className="hidden md:flex gap-1 ml-auto items-center">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
            {tipoAcesso && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
            {tipoAcesso && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start flex items-center gap-3 px-3 py-2 text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
