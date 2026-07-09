import {
  Users,
  Receipt,
  CheckSquare,
  UsersRound,
  AlertCircle,
  FileText,
  LayoutDashboard,
  DollarSign,
  Building2,
  Clock,
  FileSignature,
  ScrollText,
  type LucideIcon,
} from "lucide-react"

// Fonte única de verdade pra navegação — consumida pela sidebar (components/sidebar-navigation.tsx)
// e pelo command palette (components/command-palette.tsx), pra nunca divergir entre os dois.

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles?: string[]
  badgeKey?: "aprovacoes" | "painelFinanceiro" | "correcoes" | "acompanhamento"
  /** Palavras extras pra achar o item na busca sem precisar digitar o label exato. */
  keywords?: string[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface Workspace {
  id: string
  label: string
  icon: LucideIcon
  groups: NavGroup[]
}

// Áreas de trabalho — o que hoje era um único acordeão "Gestão de Prestadores - Financeiro"
// com 8 categorias empilhadas vira 3 workspaces distintos, cada um com sua própria seção
// na sidebar e no command palette.
export const WORKSPACES: Workspace[] = [
  {
    id: "operacao",
    label: "Operação",
    icon: LayoutDashboard,
    groups: [
      { label: "", items: [{ href: "/", label: "Visão Geral", icon: LayoutDashboard }] },
      { label: "", items: [{ href: "/cadastros", label: "Cadastros", icon: Building2, roles: ["Adm", "Financeiro"], keywords: ["prestadores", "equipes"] }] },
      {
        label: "Solicitações",
        items: [
          { href: "/pedidos", label: "Solicitações", icon: Receipt, roles: ["Adm", "Gerente"], keywords: ["ordem", "lançar"] },
          { href: "/historico", label: "Minhas Solicitações", icon: FileText, roles: ["Gerente"], badgeKey: "correcoes" },
        ],
      },
      {
        label: "Aprovações",
        items: [
          { href: "/aprovacoes", label: "Aprovações", icon: CheckSquare, roles: ["Adm", "Gerente", "Financeiro"], badgeKey: "aprovacoes" },
          { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle, roles: ["Adm", "Gerente", "Financeiro"], badgeKey: "acompanhamento", keywords: ["anexo fiscal"] },
        ],
      },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    groups: [
      {
        label: "",
        items: [
          { href: "/financeiro", label: "Painel de Aprovação Final", icon: DollarSign, roles: ["Adm", "Financeiro"], badgeKey: "painelFinanceiro", keywords: ["pagar", "notas recebidas"] },
          { href: "/meus-pagamentos", label: "Minhas Ordens", icon: Receipt, roles: ["Gerente", "Financeiro"] },
        ],
      },
      { label: "", items: [{ href: "/gestao/notas", label: "Notas Fiscais", icon: FileText, roles: ["Adm", "Financeiro"] }] },
      { label: "", items: [{ href: "/financeiro?tab=prorrogacoes", label: "Prorrogações", icon: Clock, roles: ["Adm", "Financeiro"] }] },
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: FileSignature,
    groups: [
      { label: "", items: [{ href: "/contratos", label: "Contratos", icon: FileSignature, roles: ["Adm", "Financeiro"] }] },
      {
        label: "Notas e Reajuste de Serviço",
        items: [
          { href: "/gestao", label: "Visão Geral", icon: UsersRound, roles: ["Adm", "Financeiro"] },
          { href: "/gestao/reajustes", label: "Reajustes Contratuais", icon: DollarSign, roles: ["Adm", "Financeiro"] },
          { href: "/gestao/aceites", label: "Aceites de Termos", icon: CheckSquare, roles: ["Adm", "Financeiro"] },
        ],
      },
    ],
  },
]

export const COLABORADOR_LINKS: NavItem[] = [
  { href: "/meus-pagamentos", label: "Minhas Ordens", icon: Receipt },
  { href: "/meus-contratos", label: "Meus Contratos", icon: FileSignature },
]

export const SUPERVISOR_LINKS: NavItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/pedidos", label: "Solicitações", icon: Receipt },
  { href: "/historico", label: "Minhas Solicitações", icon: FileText },
  { href: "/meus-pagamentos", label: "Minhas Ordens", icon: DollarSign },
  { href: "/supervisor/notas-equipe", label: "Notas da Equipe Operacional", icon: Users },
  { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle },
]

// SuperAdmin (time FluWork) não pertence a nenhuma empresa — menu próprio, sem os workspaces
// operacionais de uma empresa cliente.
export const SUPERADMIN_LINKS: NavItem[] = [
  { href: "/admin", label: "Painel FluWork", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/dados/colaboradores", label: "Prestadores (todas)", icon: Users },
  { href: "/admin/dados/contratos", label: "Contratos (todas)", icon: FileSignature },
  { href: "/admin/dados/pedidos", label: "Ordens de Pagamento (todas)", icon: DollarSign },
  { href: "/admin/dados/notas-fiscais", label: "Notas fiscais (todas)", icon: FileText },
  { href: "/admin/logs", label: "Log de auditoria", icon: ScrollText },
]

export const REDEFINIR_SENHA_ITEM: NavItem = { href: "/redefinir-senha", label: "Redefinir Senha", icon: Users }

function itemMatchesRole(item: NavItem, tipoAcesso?: string) {
  return !item.roles || item.roles.includes(tipoAcesso || "")
}

/** Todos os itens de navegação visíveis pro papel logado, já filtrados por permissão —
 *  usado tanto pra montar a sidebar quanto pra indexar o command palette. */
export function getNavForRole(tipoAcesso?: string): { workspaces: Workspace[]; flat: NavItem[] } {
  if (tipoAcesso === "Colaborador") {
    return { workspaces: [{ id: "colaborador", label: "", icon: LayoutDashboard, groups: [{ label: "", items: COLABORADOR_LINKS }] }], flat: COLABORADOR_LINKS }
  }
  if (tipoAcesso === "Supervisor") {
    return { workspaces: [{ id: "supervisor", label: "", icon: LayoutDashboard, groups: [{ label: "", items: SUPERVISOR_LINKS }] }], flat: SUPERVISOR_LINKS }
  }
  if (tipoAcesso === "SuperAdmin") {
    return { workspaces: [{ id: "superadmin", label: "", icon: LayoutDashboard, groups: [{ label: "", items: SUPERADMIN_LINKS }] }], flat: SUPERADMIN_LINKS }
  }

  const workspaces = WORKSPACES.map((ws) => ({
    ...ws,
    groups: ws.groups
      .map((group) => ({ ...group, items: group.items.filter((item) => itemMatchesRole(item, tipoAcesso)) }))
      .filter((group) => group.items.length > 0),
  })).filter((ws) => ws.groups.length > 0)

  const flat = workspaces.flatMap((ws) => ws.groups.flatMap((g) => g.items))
  return { workspaces, flat }
}
