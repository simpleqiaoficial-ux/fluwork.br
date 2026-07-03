"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  Receipt,
  CheckSquare,
  LogOut,
  UsersRound,
  AlertCircle,
  FileText,
  LayoutDashboard,
  DollarSign,
  Menu,
  X,
  Lock,
  Building2,
  Landmark,
  ScrollText,
} from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { contarPendencias } from "@/app/actions/contadores"

interface SidebarNavigationProps {
  tipoAcesso?: string
}

export function SidebarNavigation({ tipoAcesso }: SidebarNavigationProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendencias, setPendencias] = useState({ aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 })

  useEffect(() => {
    const fetchPendencias = async () => {
      try {
        const counts = await contarPendencias()
        setPendencias(counts)
      } catch {}
    }
    fetchPendencias()
    const interval = setInterval(fetchPendencias, 30000)
    return () => clearInterval(interval)
  }, [])

  const getLinks = () => {
    if (tipoAcesso === "Colaborador") {
      return [
        { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt },
        { href: "/faturas", label: "Faturas", icon: FileText },
        { href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock },
      ]
    }

    if (tipoAcesso === "Supervisor") {
      return [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/pedidos", label: "Criar Pedido", icon: Receipt },
        { href: "/historico", label: "Meus Pedidos", icon: FileText },
        { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: DollarSign },
        { href: "/faturas", label: "Faturas", icon: FileText },
        { href: "/supervisor/notas-equipe", label: "Notas da Equipe", icon: Users },
        { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle },
        { href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock },
      ]
    }

    const allLinks = [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
      { href: "/cadastros", label: "Cadastros", icon: Building2, roles: ["Adm", "Financeiro"] },
      { href: "/pedidos", label: "Criar Pedido", icon: Receipt, roles: ["Adm", "Gerente"] },
      { href: "/historico", label: "Meus Pedidos", icon: FileText, roles: ["Gerente"], badge: pendencias.correcoes },
      { href: "/aprovacoes", label: "Aprovacoes", icon: CheckSquare, roles: ["Adm", "Gerente", "Financeiro"], badge: pendencias.aprovacoes },
      { href: "/financeiro", label: "Painel Financeiro", icon: DollarSign, roles: ["Adm", "Financeiro"], badge: pendencias.painelFinanceiro },
      { href: "/gestao", label: "Gestao de Pessoas", icon: UsersRound, roles: ["Adm", "Financeiro"] },
      { href: "/fiscal", label: "Fiscal", icon: Landmark, roles: ["Adm", "Financeiro"] },
      { href: "/contratos", label: "Contratos", icon: ScrollText, roles: ["Adm", "Financeiro"] },
      { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt, roles: ["Gerente", "Financeiro"] },
      { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle, roles: ["Adm", "Gerente", "Financeiro"], badge: pendencias.correcoes },
      { href: "/faturas", label: "Faturas", icon: FileText, roles: ["Adm", "Financeiro", "Gerente"] },
    ]

    const filteredLinks = allLinks.filter((link) => !link.roles || link.roles.includes(tipoAcesso || ""))
    return [...filteredLinks, { href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock }]
  }

  const links = getLinks()

  const handleLogout = async () => {
    await logout()
  }

  const NavLink = ({ link, onClick }: { link: any; onClick?: () => void }) => {
    const Icon = link.icon
    const isActive = pathname === link.href
    const hasBadge = link.badge && link.badge > 0

    return (
      <Link
        href={link.href}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{link.label}</span>
        {hasBadge && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium px-1.5">
            {link.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-50 h-9 w-9"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

{/* Desktop sidebar */}
  <aside className="fixed top-0 left-0 z-40 h-screen w-60 hidden lg:flex flex-col border-r bg-card">
  <div className="flex items-center h-16 px-4 border-b">
  <Link href="/" className="flex items-center">
  <img 
    src="/fluxopay-logo.png" 
    alt="Fluxopay" 
    className="h-12 w-auto"
  />
  </Link>
  </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {links.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
        </nav>

        {tipoAcesso && (
          <div className="border-t p-3">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-10 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setMobileOpen(false)} />
<aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-card border-r lg:hidden flex flex-col animate-in slide-in-from-left duration-200">
  <div className="flex items-center justify-between h-16 px-4 border-b">
  <Link href="/" className="flex items-center">
  <img 
    src="/fluxopay-logo.png" 
    alt="Fluxopay" 
    className="h-12 w-auto"
  />
  </Link>
  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8">
  <X className="h-4 w-4" />
  </Button>
  </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {links.map((link) => (
                <NavLink key={link.href} link={link} onClick={() => setMobileOpen(false)} />
              ))}
            </nav>

            {tipoAcesso && (
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-10 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  )
}
