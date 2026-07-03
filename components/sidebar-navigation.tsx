"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  Clock,
  Landmark,
  ScrollText,
  Search,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { contarPendencias } from "@/app/actions/contadores"

interface SidebarNavigationProps {
  tipoAcesso?: string
}

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles?: string[]
  badgeKey?: "aprovacoes" | "painelFinanceiro" | "correcoes"
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [{ href: "/", label: "Visão Geral", icon: LayoutDashboard }],
  },
  {
    label: "Cadastros",
    items: [{ href: "/cadastros", label: "Cadastros", icon: Building2, roles: ["Adm", "Financeiro"] }],
  },
  {
    label: "Solicitações",
    items: [
      { href: "/pedidos", label: "Solicitações", icon: Receipt, roles: ["Adm", "Gerente"] },
      { href: "/historico", label: "Minhas Solicitações", icon: FileText, roles: ["Gerente"], badgeKey: "correcoes" },
    ],
  },
  {
    label: "Aprovações",
    items: [
      {
        href: "/aprovacoes",
        label: "Aprovações",
        icon: CheckSquare,
        roles: ["Adm", "Gerente", "Financeiro"],
        badgeKey: "aprovacoes",
      },
      {
        href: "/acompanhamento",
        label: "Acompanhamento",
        icon: AlertCircle,
        roles: ["Adm", "Gerente", "Financeiro"],
        badgeKey: "correcoes",
      },
    ],
  },
  {
    label: "Gestão Financeira",
    items: [
      {
        href: "/financeiro",
        label: "Painel Financeiro",
        icon: DollarSign,
        roles: ["Adm", "Financeiro"],
        badgeKey: "painelFinanceiro",
      },
      { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt, roles: ["Gerente", "Financeiro"] },
      { href: "/faturas", label: "Faturas", icon: FileText, roles: ["Adm", "Financeiro", "Gerente"] },
    ],
  },
  {
    label: "Notas Fiscais",
    items: [{ href: "/gestao/notas", label: "Notas Fiscais", icon: FileText, roles: ["Adm", "Financeiro"] }],
  },
  {
    label: "Prorrogações",
    items: [{ href: "/financeiro?tab=prorrogacoes", label: "Prorrogações", icon: Clock, roles: ["Adm", "Financeiro"] }],
  },
  {
    label: "Gestão de Prestadores",
    items: [
      { href: "/gestao", label: "Gestão de Prestadores", icon: UsersRound, roles: ["Adm", "Financeiro"] },
      { href: "/gestao/reajustes", label: "Reajustes Contratuais", icon: DollarSign, roles: ["Adm", "Financeiro"] },
      { href: "/gestao/aceites", label: "Aceites de Termos", icon: CheckSquare, roles: ["Adm", "Financeiro"] },
    ],
  },
  {
    label: "Em breve",
    items: [
      { href: "/fiscal", label: "Fiscal", icon: Landmark, roles: ["Adm", "Financeiro"] },
      { href: "/contratos", label: "Contratos", icon: ScrollText, roles: ["Adm", "Financeiro"] },
    ],
  },
]

const COLABORADOR_LINKS: NavItem[] = [
  { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt },
  { href: "/faturas", label: "Faturas", icon: FileText },
]

const SUPERVISOR_LINKS: NavItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/pedidos", label: "Solicitações", icon: Receipt },
  { href: "/historico", label: "Minhas Solicitações", icon: FileText },
  { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: DollarSign },
  { href: "/faturas", label: "Faturas", icon: FileText },
  { href: "/supervisor/notas-equipe", label: "Notas da Equipe Operacional", icon: Users },
  { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle },
]

const COLLAPSE_STORAGE_KEY = "fluwork_sidebar_collapsed"

export function SidebarNavigation({ tipoAcesso }: SidebarNavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const [pendencias, setPendencias] = useState({ aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 })

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY)
    if (stored === "1") setCollapsed(true)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "4.5rem" : "16rem")
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0")
  }, [collapsed])

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

  const isItemActive = (href: string) => {
    const [itemPath, itemQuery] = href.split("?")
    if (pathname !== itemPath) return false
    if (!itemQuery) return !searchParams.get("tab")
    const itemTab = new URLSearchParams(itemQuery).get("tab")
    return searchParams.get("tab") === itemTab
  }

  const baseGroups: NavGroup[] = (() => {
    if (tipoAcesso === "Colaborador") {
      return [{ label: "", items: COLABORADOR_LINKS }]
    }
    if (tipoAcesso === "Supervisor") {
      return [{ label: "", items: SUPERVISOR_LINKS }]
    }
    return NAV_GROUPS.map((group) => ({
      label: group.label,
      items: group.items.filter((item) => !item.roles || item.roles.includes(tipoAcesso || "")),
    })).filter((group) => group.items.length > 0)
  })()

  const q = query.trim().toLowerCase()
  const groups: NavGroup[] = q
    ? baseGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(q)) }))
        .filter((group) => group.items.length > 0)
    : baseGroups

  const bottomLink: NavItem = { href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock }

  const handleLogout = async () => {
    await logout()
  }

  const NavLink = ({ item, onClick, forceExpanded }: { item: NavItem; onClick?: () => void; forceExpanded?: boolean }) => {
    const Icon = item.icon
    const isActive = isItemActive(item.href)
    const badge = item.badgeKey ? pendencias[item.badgeKey] : 0
    const isCollapsed = collapsed && !forceExpanded

    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150",
          isCollapsed && "lg:justify-center lg:px-0",
          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn("flex-1 truncate", isCollapsed && "lg:hidden")}>{item.label}</span>
        {badge > 0 && (
          <span
            className={cn(
              "ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium px-1.5",
              isCollapsed && "lg:hidden",
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    )
  }

  const NavGroups = ({ onLinkClick, forceExpanded }: { onLinkClick?: () => void; forceExpanded?: boolean }) => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
      {groups.map((group, i) => (
        <div key={group.label || i}>
          {group.label && (
            <p
              className={cn(
                "px-3 mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                collapsed && !forceExpanded && "lg:hidden",
              )}
            >
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} onClick={onLinkClick} forceExpanded={forceExpanded} />
            ))}
          </div>
        </div>
      ))}
      {groups.length === 0 && (
        <p className={cn("px-3 text-sm text-muted-foreground", collapsed && !forceExpanded && "lg:hidden")}>Nada encontrado</p>
      )}
    </nav>
  )

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
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen hidden lg:flex flex-col border-r bg-card transition-[width] duration-150",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
        )}
      >
        <div className={cn("flex items-center h-16 px-4 border-b", collapsed && "lg:justify-center lg:px-0")}>
          <Link href="/" className={cn("flex items-center", collapsed && "lg:hidden")}>
            <span className="text-base font-semibold tracking-tight">
              Flu<span className="text-primary">Work</span>
            </span>
          </Link>
          {collapsed && (
            <Link href="/" className="hidden lg:flex items-center justify-center">
              <span className="text-base font-semibold text-primary">F</span>
            </Link>
          )}
        </div>

        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no menu..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        )}

        <NavGroups />

        <div className="border-t p-3 space-y-1">
          <NavLink item={bottomLink} />
          {tipoAcesso && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-10 text-sm font-medium",
                collapsed && "lg:justify-center lg:px-0",
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className={cn(collapsed && "lg:hidden")}>Sair</span>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-9 text-sm font-medium",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            <span className={cn(collapsed && "lg:hidden")}>Recolher menu</span>
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed top-0 left-0 z-50 h-screen w-72 bg-card border-r lg:hidden flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link href="/" className="flex items-center">
                <span className="text-base font-semibold tracking-tight">
                  Flu<span className="text-primary">Work</span>
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-3 pt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar no menu..."
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>

            <NavGroups onLinkClick={() => setMobileOpen(false)} forceExpanded />

            <div className="border-t p-3">
              <NavLink item={bottomLink} onClick={() => setMobileOpen(false)} forceExpanded />
              {tipoAcesso && (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-10 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
