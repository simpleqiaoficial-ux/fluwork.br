"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
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
  X,
  Lock,
  Building2,
  Clock,
  Search,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Briefcase,
  FileSignature,
  ScrollText,
} from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useState, useEffect, useMemo } from "react"
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
    label: "Notas e Reajuste de Serviço",
    items: [
      { href: "/gestao", label: "Visão Geral", icon: UsersRound, roles: ["Adm", "Financeiro"] },
      { href: "/gestao/reajustes", label: "Reajustes Contratuais", icon: DollarSign, roles: ["Adm", "Financeiro"] },
      { href: "/gestao/aceites", label: "Aceites de Termos", icon: CheckSquare, roles: ["Adm", "Financeiro"] },
    ],
  },
]

// Módulo próprio, fora do acordeão "Gestão de Prestadores - Financeiro".
const CONTRATOS_MODULE: NavItem = { href: "/contratos", label: "Contratos", icon: FileSignature, roles: ["Adm", "Financeiro"] }

const COLABORADOR_LINKS: NavItem[] = [
  { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: Receipt },
  { href: "/meus-contratos", label: "Meus Contratos", icon: FileSignature },
]

const SUPERVISOR_LINKS: NavItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/pedidos", label: "Solicitações", icon: Receipt },
  { href: "/historico", label: "Minhas Solicitações", icon: FileText },
  { href: "/meus-pagamentos", label: "Meus Pagamentos", icon: DollarSign },
  { href: "/supervisor/notas-equipe", label: "Notas da Equipe Operacional", icon: Users },
  { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle },
]

// SuperAdmin (time FluWork) não pertence a nenhuma empresa — menu próprio, sem os módulos
// operacionais de uma empresa cliente.
const SUPERADMIN_LINKS: NavItem[] = [
  { href: "/admin", label: "Painel FluWork", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/dados/colaboradores", label: "Colaboradores (todas)", icon: Users },
  { href: "/admin/dados/contratos", label: "Contratos (todas)", icon: FileSignature },
  { href: "/admin/dados/pedidos", label: "Pedidos (todas)", icon: DollarSign },
  { href: "/admin/dados/notas-fiscais", label: "Notas fiscais (todas)", icon: FileText },
  { href: "/admin/logs", label: "Log de auditoria", icon: ScrollText },
]

const COLLAPSE_STORAGE_KEY = "fluwork_sidebar_collapsed"
const ROOT_STORAGE_KEY = "fluwork_root_open"
const ROOT_LABEL = "Gestão de Prestadores - Financeiro"

function itemPath(href: string) {
  return href.split("?")[0]
}

export function SidebarNavigation({ tipoAcesso }: SidebarNavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [rootOpen, setRootOpen] = useState(true)
  const [pendencias, setPendencias] = useState({ aprovacoes: 0, painelFinanceiro: 0, correcoes: 0 })

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY)
    if (stored === "1") setCollapsed(true)
    const storedRoot = window.localStorage.getItem(ROOT_STORAGE_KEY)
    if (storedRoot === "0") setRootOpen(false)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(ROOT_STORAGE_KEY, rootOpen ? "1" : "0")
  }, [rootOpen])

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
    const [itemP, itemQuery] = href.split("?")
    if (pathname !== itemP) return false
    if (!itemQuery) return !searchParams.get("tab")
    const itemTab = new URLSearchParams(itemQuery).get("tab")
    return searchParams.get("tab") === itemTab
  }

  const baseGroups: NavGroup[] = useMemo(() => {
    if (tipoAcesso === "Colaborador") {
      return [{ label: "", items: COLABORADOR_LINKS }]
    }
    if (tipoAcesso === "Supervisor") {
      return [{ label: "", items: SUPERVISOR_LINKS }]
    }
    if (tipoAcesso === "SuperAdmin") {
      return [{ label: "", items: SUPERADMIN_LINKS }]
    }
    return NAV_GROUPS.map((group) => ({
      label: group.label,
      items: group.items.filter((item) => !item.roles || item.roles.includes(tipoAcesso || "")),
    })).filter((group) => group.items.length > 0)
  }, [tipoAcesso])

  // Contratos é um módulo próprio, fora do acordeão "Gestão de Prestadores - Financeiro".
  const contratosVisivel =
    tipoAcesso !== "Colaborador" &&
    tipoAcesso !== "Supervisor" &&
    tipoAcesso !== "SuperAdmin" &&
    (!CONTRATOS_MODULE.roles || CONTRATOS_MODULE.roles.includes(tipoAcesso || ""))

  // Mantém aberta a categoria (e o módulo-raiz) que contém a rota atual, sem fechar as demais.
  useEffect(() => {
    const activeGroup = baseGroups.find((group) => group.items.some((item) => itemPath(item.href) === pathname))
    if (activeGroup) {
      setRootOpen(true)
      if (activeGroup.items.length > 1) {
        setOpenGroups((prev) => (prev[activeGroup.label] ? prev : { ...prev, [activeGroup.label]: true }))
      }
    }
  }, [pathname, baseGroups])

  const q = query.trim().toLowerCase()
  const groups: NavGroup[] = q
    ? baseGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(q)) }))
        .filter((group) => group.items.length > 0)
    : baseGroups

  const flatItems = useMemo(
    () => [...baseGroups.flatMap((g) => g.items), ...(contratosVisivel ? [CONTRATOS_MODULE] : [])],
    [baseGroups, contratosVisivel],
  )

  const bottomLink: NavItem = { href: "/redefinir-senha", label: "Redefinir Senha", icon: Lock }

  // Itens mais usados do perfil pra navegação primária no celular — mesmos itens já
  // filtrados por permissão em flatItems, só pega os 4 primeiros (o resto fica no "Mais").
  const bottomNavItems = useMemo(() => flatItems.slice(0, 4), [flatItems])

  const handleLogout = async () => {
    await logout()
  }

  const NavLink = ({
    item,
    onClick,
    level = 0,
    iconOnly,
  }: {
    item: NavItem
    onClick?: () => void
    level?: 0 | 1 | 2
    iconOnly?: boolean
  }) => {
    const Icon = item.icon
    const isActive = isItemActive(item.href)
    const badge = item.badgeKey ? pendencias[item.badgeKey] : 0
    const levelPadding = level === 2 ? "pl-14 pr-3" : level === 1 ? "pl-9 pr-3" : "px-3"

    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={iconOnly ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 py-2 text-sm font-medium rounded-md transition-colors duration-150",
          iconOnly ? "justify-center px-0" : levelPadding,
          isActive
            ? "bg-primary/10 text-primary before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!iconOnly && <span className="flex-1 truncate">{item.label}</span>}
        {badge > 0 && !iconOnly && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  // Sidebar recolhida (só ícones): lista plana de todos os itens, sem categorias.
  const CollapsedRail = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
      {flatItems.map((item) => (
        <NavLink key={item.href} item={item} iconOnly />
      ))}
    </nav>
  )

  // Sidebar expandida: um único item-raiz (o módulo) que expande e revela todas as categorias.
  // Categorias com 1 item viram link direto; com 2+ itens viram acordeão dentro do módulo.
  const NavGroups = ({ onLinkClick }: { onLinkClick?: () => void }) => {
    const isRootOpen = Boolean(q) || rootOpen
    const contratosMatchesSearch = !q || CONTRATOS_MODULE.label.toLowerCase().includes(q)

    // SuperAdmin não pertence a nenhuma empresa — sem o acordeão "Gestão de Prestadores -
    // Financeiro" (que é sobre a operação de UMA empresa cliente), só os links diretos.
    if (tipoAcesso === "SuperAdmin") {
      return (
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {groups.flatMap((group) => group.items).map((item) => (
            <NavLink key={item.href} item={item} onClick={onLinkClick} />
          ))}
        </nav>
      )
    }

    return (
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div>
          <button
            type="button"
            onClick={() => setRootOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-150 text-foreground hover:bg-accent"
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">{ROOT_LABEL}</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", isRootOpen && "rotate-180")}
            />
          </button>

          {isRootOpen && (
            <div className="mt-0.5 space-y-1">
              {groups.map((group) => {
                if (!group.label || group.items.length === 1) {
                  return group.items.map((item) => (
                    <NavLink key={item.href} item={item} onClick={onLinkClick} level={1} />
                  ))
                }

                const isOpen = Boolean(q) || openGroups[group.label]
                const GroupIcon = group.items[0].icon
                const groupHasActiveItem = group.items.some((item) => isItemActive(item.href))

                return (
                  <div key={group.label}>
                    <button
                      type="button"
                      onClick={() => setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))}
                      className={cn(
                        "w-full flex items-center gap-3 pl-9 pr-3 py-2 text-sm font-medium rounded-md transition-colors duration-150",
                        groupHasActiveItem && !isOpen
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      )}
                    >
                      <GroupIcon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate text-left">{group.label}</span>
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", isOpen && "rotate-180")}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-0.5 space-y-0.5">
                        {group.items.map((item) => (
                          <NavLink key={item.href} item={item} onClick={onLinkClick} level={2} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {groups.length === 0 && <p className="px-3 text-sm text-muted-foreground">Nada encontrado</p>}
            </div>
          )}
        </div>

        {contratosVisivel && contratosMatchesSearch && (
          <NavLink item={CONTRATOS_MODULE} onClick={onLinkClick} />
        )}
      </nav>
    )
  }

  return (
    <>
      {/* Navegação primária no celular — substitui o antigo botão flutuante de menu */}
      <BottomNavigation items={bottomNavItems} onMoreClick={() => setMobileOpen(true)} />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen hidden lg:flex flex-col border-r bg-card transition-[width] duration-150",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
        )}
      >
        <div className={cn("flex items-center h-16 px-4 border-b", collapsed && "lg:justify-center lg:px-0")}>
          {collapsed ? (
            <Link href="/" className="flex items-center justify-center">
              <Logo showWordmark={false} size={32} />
            </Link>
          ) : (
            <Link href="/" className="flex items-center">
              <Logo />
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

        {collapsed ? <CollapsedRail /> : <NavGroups />}

        <div className="border-t p-3 space-y-1">
          <NavLink item={bottomLink} iconOnly={collapsed} />
          {tipoAcesso && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-10 text-sm font-medium",
                collapsed && "justify-center px-0",
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className={cn(collapsed && "hidden")}>Sair</span>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-9 text-sm font-medium",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            <span className={cn(collapsed && "hidden")}>Recolher menu</span>
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
                <Logo />
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

            <NavGroups onLinkClick={() => setMobileOpen(false)} />

            <div className="border-t p-3">
              <NavLink item={bottomLink} onClick={() => setMobileOpen(false)} />
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
