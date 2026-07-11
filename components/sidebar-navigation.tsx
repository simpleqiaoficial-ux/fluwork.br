"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import { LogOut, UserCircle, ChevronsLeft, ChevronsRight, ChevronDown, Search, Command } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import { contarPendencias } from "@/app/actions/contadores"
import { getNavForRole, type NavItem, type NavGroup, type Workspace } from "@/lib/nav-config"
import { CommandPalette } from "@/components/command-palette"

interface SidebarNavigationProps {
  tipoAcesso?: string
}

const COLLAPSE_STORAGE_KEY = "fluwork_sidebar_collapsed"
const WORKSPACES_OPEN_KEY = "fluwork_workspaces_open"
const perfilLink: NavItem = { href: "/perfil", label: "Meu Perfil", icon: UserCircle }

function itemPath(href: string) {
  return href.split("?")[0]
}

export function SidebarNavigation({ tipoAcesso }: SidebarNavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [openWorkspaces, setOpenWorkspaces] = useState<Record<string, boolean>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [pendencias, setPendencias] = useState({ aprovacoes: 0, painelFinanceiro: 0, correcoes: 0, acompanhamento: 0 })

  const { workspaces, flat: flatItems } = useMemo(() => getNavForRole(tipoAcesso), [tipoAcesso])
  const isSimpleMenu = tipoAcesso === "Colaborador" || tipoAcesso === "Supervisor" || tipoAcesso === "SuperAdmin"

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY)
    if (stored === "1") setCollapsed(true)
    try {
      const storedWorkspaces = JSON.parse(window.localStorage.getItem(WORKSPACES_OPEN_KEY) || "{}")
      setOpenWorkspaces(storedWorkspaces)
    } catch {}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Atalho global de busca — Cmd+K (Mac) / Ctrl+K (Windows/Linux).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const isItemActive = (href: string) => {
    const [itemP, itemQuery] = href.split("?")
    if (pathname !== itemP) return false
    if (!itemQuery) return !searchParams.get("tab")
    const itemTab = new URLSearchParams(itemQuery).get("tab")
    return searchParams.get("tab") === itemTab
  }

  // Mantém aberto o workspace (e a categoria) que contém a rota atual, sem fechar os demais
  // que o usuário já tinha aberto manualmente.
  useEffect(() => {
    for (const ws of workspaces) {
      const activeGroup = ws.groups.find((g) => g.items.some((item) => itemPath(item.href) === pathname))
      if (activeGroup) {
        setOpenWorkspaces((prev) => {
          if (prev[ws.id]) return prev
          const next = { ...prev, [ws.id]: true }
          window.localStorage.setItem(WORKSPACES_OPEN_KEY, JSON.stringify(next))
          return next
        })
        if (activeGroup.items.length > 1) {
          setOpenGroups((prev) => (prev[activeGroup.label] ? prev : { ...prev, [activeGroup.label]: true }))
        }
        break
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, workspaces])

  const toggleWorkspace = (id: string) => {
    setOpenWorkspaces((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      window.localStorage.setItem(WORKSPACES_OPEN_KEY, JSON.stringify(next))
      return next
    })
  }

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
    const badge = item.badgeKey ? (pendencias?.[item.badgeKey] ?? 0) : 0
    const levelPadding = level === 2 ? "pl-9 pr-3" : level === 1 ? "pl-6 pr-3" : "px-3"

    return (
      <Link
        href={item.href}
        onClick={onClick}
        title={iconOnly ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-100",
          iconOnly ? "justify-center px-0" : levelPadding,
          isActive
            ? "bg-sidebar-active text-sidebar-active-foreground before:absolute before:inset-y-0.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-icon"
            : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
        )}
      >
        <Icon
          className={cn("h-[15px] w-[15px] shrink-0", isActive && "text-sidebar-icon")}
          strokeWidth={1.75}
        />
        {!iconOnly && <span className="flex-1 truncate">{item.label}</span>}
        {badge > 0 && !iconOnly && (
          <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  // Sidebar recolhida (só ícones): lista plana de todos os itens, sem categorias.
  const CollapsedRail = () => (
    <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
      {flatItems.map((item) => (
        <NavLink key={item.href} item={item} iconOnly />
      ))}
    </nav>
  )

  const GroupBlock = ({ group, onLinkClick }: { group: NavGroup; onLinkClick?: () => void }) => {
    if (!group.label || group.items.length === 1) {
      return (
        <>
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onClick={onLinkClick} level={1} />
          ))}
        </>
      )
    }

    const isOpen = openGroups[group.label]
    const groupHasActiveItem = group.items.some((item) => isItemActive(item.href))

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))}
          className={cn(
            "w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-100",
            groupHasActiveItem && !isOpen ? "text-sidebar-icon" : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
          )}
        >
          <span className="flex-1 truncate text-left">{group.label}</span>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-100", isOpen && "rotate-180")} />
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
  }

  // Cada workspace vira sua própria seção — cabeçalho fixo (não recolhível) pra deixar clara
  // a estrutura em "áreas de trabalho" mesmo com o sistema crescendo pra dezenas de módulos,
  // e um corpo colapsável por baixo pra quem quer reduzir ruído visual.
  const WorkspaceBlock = ({ workspace, onLinkClick }: { workspace: Workspace; onLinkClick?: () => void }) => {
    const isOpen = openWorkspaces[workspace.id] ?? true
    const WsIcon = workspace.icon

    return (
      <div className="mb-4 last:mb-0">
        <button
          type="button"
          onClick={() => toggleWorkspace(workspace.id)}
          className="w-full flex items-center gap-2 px-3 py-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70 hover:text-sidebar-muted transition-colors"
        >
          <WsIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 truncate text-left">{workspace.label}</span>
          <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-100", !isOpen && "-rotate-90")} />
        </button>
        {isOpen && (
          <div className="space-y-0.5">
            {workspace.groups.map((group, i) => (
              <GroupBlock key={group.label || i} group={group} onLinkClick={onLinkClick} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const NavBody = ({ onLinkClick }: { onLinkClick?: () => void }) => {
    if (isSimpleMenu) {
      return (
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {flatItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onLinkClick} />
          ))}
        </nav>
      )
    }

    return (
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {workspaces.map((ws) => (
          <WorkspaceBlock key={ws.id} workspace={ws} onLinkClick={onLinkClick} />
        ))}
      </nav>
    )
  }

  // Item da barra inferior mobile: ícone em cima, rótulo embaixo, largura fixa pra virar uma
  // fileira que rola horizontalmente (o usuário arrasta com o dedo pra ver o resto).
  const TabBarItem = ({
    icon: Icon,
    label,
    href,
    active,
    badge,
    onClick,
  }: {
    icon: NavItem["icon"]
    label: string
    href?: string
    active?: boolean
    badge?: number
    onClick?: () => void
  }) => {
    const itemClassName = cn(
      "flex shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-3.5 py-2 min-w-[68px] transition-colors",
      active ? "bg-white/15 text-white" : "text-primary-foreground/75 active:bg-white/10 active:text-white",
    )
    const content = (
      <>
        <span className="relative flex items-center justify-center">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
          {!!badge && badge > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-destructive-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="whitespace-nowrap text-[10.5px] font-medium leading-none">{label}</span>
      </>
    )

    if (href) {
      return (
        <Link href={href} onClick={onClick} className={itemClassName}>
          {content}
        </Link>
      )
    }
    return (
      <button type="button" onClick={onClick} className={itemClassName}>
        {content}
      </button>
    )
  }

  return (
    <>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} tipoAcesso={tipoAcesso} />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-150",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-64",
        )}
      >
        <div className={cn("flex items-center h-14 px-4 border-b border-sidebar-border", collapsed && "lg:justify-center lg:px-0")}>
          {collapsed ? (
            <Link href="/" className="flex items-center justify-center">
              <Logo showWordmark={false} size={30} dark />
            </Link>
          ) : (
            <Link href="/" className="flex items-center">
              <Logo dark />
            </Link>
          )}
        </div>

        {!collapsed && (
          <div className="px-2.5 pt-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-hover/60 px-2.5 h-8 text-[13px] text-sidebar-muted hover:border-sidebar-muted/40 hover:text-sidebar-foreground transition-colors"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Buscar...</span>
              <span className="flex items-center gap-0.5 rounded border border-sidebar-border bg-sidebar px-1 py-0.5 text-[10px] font-medium">
                <Command className="h-2.5 w-2.5" />K
              </span>
            </button>
          </div>
        )}

        {collapsed ? <CollapsedRail /> : <NavBody />}

        <div className="border-t border-sidebar-border p-2.5 space-y-0.5">
          {!collapsed && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
              Configurações
            </p>
          )}
          <NavLink item={perfilLink} iconOnly={collapsed} />
          {tipoAcesso && (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-2.5 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover h-8 text-[13px] font-medium",
                collapsed && "justify-center px-0",
              )}
            >
              <LogOut className="h-[15px] w-[15px]" />
              <span className={cn(collapsed && "hidden")}>Sair</span>
            </Button>
          )}
        </div>

        <div className="p-2.5">
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-start gap-2.5 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover h-8 text-[13px] font-medium",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <ChevronsRight className="h-[15px] w-[15px]" /> : <ChevronsLeft className="h-[15px] w-[15px]" />}
            <span className={cn(collapsed && "hidden")}>Recolher menu</span>
          </Button>
        </div>
      </aside>

      {/* Navegação mobile — barra fixa embaixo, sempre visível (não é um menu que abre/fecha).
          Todos os itens ficam numa única fileira horizontal rolável: o usuário arrasta com o
          dedo pra ver o resto, igual um app nativo. Busca, Perfil e Sair entram na mesma fileira. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-primary shadow-[0_-2px_12px_rgba(0,0,0,0.15)]"
        aria-label="Navegação"
      >
        <div className="flex items-stretch gap-1 overflow-x-auto px-2 pt-1.5 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {flatItems.map((item) => (
            <TabBarItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isItemActive(item.href)}
              badge={item.badgeKey ? (pendencias?.[item.badgeKey] ?? 0) : 0}
            />
          ))}
          <TabBarItem icon={Search} label="Buscar" onClick={() => setPaletteOpen(true)} />
          <TabBarItem icon={UserCircle} label="Perfil" href="/perfil" active={isItemActive("/perfil")} />
          {tipoAcesso && <TabBarItem icon={LogOut} label="Sair" onClick={handleLogout} />}
        </div>
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  )
}
