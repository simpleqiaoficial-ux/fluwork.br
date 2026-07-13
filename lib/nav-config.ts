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
  ShieldCheck,
  CalendarClock,
  Database,
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
          { href: "/meu-compliance", label: "Meu Compliance", icon: ShieldCheck, roles: ["Gerente", "Financeiro"] },
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
  { href: "/meu-compliance", label: "Meu Compliance", icon: ShieldCheck },
]

export const SUPERVISOR_LINKS: NavItem[] = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/pedidos", label: "Solicitações", icon: Receipt },
  { href: "/historico", label: "Minhas Solicitações", icon: FileText },
  { href: "/meus-pagamentos", label: "Minhas Ordens", icon: DollarSign },
  { href: "/meu-compliance", label: "Meu Compliance", icon: ShieldCheck },
  { href: "/supervisor/notas-equipe", label: "Notas da Equipe Operacional", icon: Users },
  { href: "/acompanhamento", label: "Acompanhamento", icon: AlertCircle },
]

// Módulo EHS & Compliance — papel próprio, nunca vê os workspaces financeiros/contratuais
// acima (nem passa pelo filtro genérico deles). Cresce fase a fase; só entram aqui itens com
// página real por trás, pra nunca linkar pra rota que ainda não existe.
export const EHS_LINKS: NavItem[] = [
  { href: "/ehs", label: "Dashboard EHS", icon: LayoutDashboard },
  { href: "/ehs/clientes", label: "Clientes", icon: Building2, keywords: ["cliente", "empresa", "contratante"] },
  { href: "/ehs/prestadores", label: "Prestadores", icon: Users, keywords: ["prestador", "colaborador", "documento", "aso", "nr", "certificado"] },
  { href: "/ehs/agenda", label: "Agenda", icon: CalendarClock, keywords: ["agenda", "integracao", "integração", "calendario", "calendário", "agendamento"] },
  { href: "/ehs/pendencias", label: "Pendências", icon: AlertCircle, keywords: ["pendencia", "pendência", "vencido", "vencimento", "alerta"] },
  { href: "/ehs/auditoria", label: "Auditoria", icon: ScrollText, keywords: ["auditoria", "log", "historico", "histórico", "quem alterou"] },
  { href: "/meu-compliance", label: "Meu Compliance", icon: ShieldCheck, keywords: ["meus documentos", "minhas integrações", "pessoal"] },
]

// SuperAdmin (time FluWork) não pertence a nenhuma empresa — menu próprio, sem os workspaces
// operacionais de uma empresa cliente.
export const SUPERADMIN_LINKS: NavItem[] = [
  { href: "/admin", label: "Painel FluWork", icon: LayoutDashboard },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/dados", label: "Espelho de Dados", icon: Database, keywords: ["banco", "tabelas", "producao", "produção", "dados"] },
  { href: "/admin/dados/colaboradores", label: "Prestadores", icon: Users },
  { href: "/admin/dados/contratos", label: "Contratos", icon: FileSignature },
  { href: "/admin/dados/pedidos", label: "Ordens de Pagamento", icon: DollarSign },
  { href: "/admin/dados/notas-fiscais", label: "Notas fiscais", icon: FileText },
  { href: "/admin/logs", label: "Log de auditoria", icon: ScrollText },
  { href: "/meu-compliance", label: "Meu Compliance", icon: ShieldCheck },
]

function itemMatchesRole(item: NavItem, tipoAcesso?: string) {
  return !item.roles || item.roles.includes(tipoAcesso || "")
}

export interface BreadcrumbSegment {
  label: string
}

/** Localiza o item ativo na árvore de navegação e devolve o caminho até ele
 *  (workspace > grupo > página) pra alimentar a barra de contexto do header. */
export function getBreadcrumbForPath(pathname: string, tipoAcesso?: string, impersonando?: boolean): BreadcrumbSegment[] {
  const { workspaces } = getNavForRole(tipoAcesso, impersonando)
  for (const ws of workspaces) {
    for (const group of ws.groups) {
      for (const item of group.items) {
        if (item.href.split("?")[0] === pathname) {
          const segments: BreadcrumbSegment[] = []
          if (ws.label) segments.push({ label: ws.label })
          if (group.label) segments.push({ label: group.label })
          segments.push({ label: item.label })
          return segments
        }
      }
    }
  }
  return []
}

/** Todos os itens de navegação visíveis pro papel logado, já filtrados por permissão —
 *  usado tanto pra montar a sidebar quanto pra indexar o command palette.
 *
 *  `impersonando`: SuperAdmin em modo "visualizar como empresa". Nesse modo ele já consegue
 *  abrir qualquer página da empresa (lib/tenant.ts:podeVisualizarPagina libera geral pra
 *  SuperAdmin+viewAsEmpresaId, e os dados já vêm escopados pela empresa via
 *  getEffectiveEmpresaId) — só faltava a sidebar mostrar o link. Aqui ele enxerga TODOS os
 *  workspaces da empresa sem filtro de papel (não só o que um "Adm" veria) mais o módulo EHS,
 *  pra cobrir de verdade qualquer página que a empresa tenha, independente de quem
 *  normalmente usaria cada uma. */
export function getNavForRole(tipoAcesso?: string, impersonando?: boolean): { workspaces: Workspace[]; flat: NavItem[] } {
  if (tipoAcesso === "Colaborador") {
    return { workspaces: [{ id: "colaborador", label: "", icon: LayoutDashboard, groups: [{ label: "", items: COLABORADOR_LINKS }] }], flat: COLABORADOR_LINKS }
  }
  if (tipoAcesso === "Supervisor") {
    return { workspaces: [{ id: "supervisor", label: "", icon: LayoutDashboard, groups: [{ label: "", items: SUPERVISOR_LINKS }] }], flat: SUPERVISOR_LINKS }
  }
  if (tipoAcesso === "SuperAdmin" && !impersonando) {
    return { workspaces: [{ id: "superadmin", label: "", icon: LayoutDashboard, groups: [{ label: "", items: SUPERADMIN_LINKS }] }], flat: SUPERADMIN_LINKS }
  }
  if (tipoAcesso === "EHS") {
    return { workspaces: [{ id: "ehs", label: "EHS & Compliance", icon: ShieldCheck, groups: [{ label: "", items: EHS_LINKS }] }], flat: EHS_LINKS }
  }

  const workspaces = WORKSPACES.map((ws) => ({
    ...ws,
    groups: ws.groups
      .map((group) => ({ ...group, items: impersonando ? group.items : group.items.filter((item) => itemMatchesRole(item, tipoAcesso)) }))
      .filter((group) => group.items.length > 0),
  })).filter((ws) => ws.groups.length > 0)

  if (impersonando) {
    workspaces.push({ id: "ehs", label: "EHS & Compliance", icon: ShieldCheck, groups: [{ label: "", items: EHS_LINKS }] })
  }

  const flat = workspaces.flatMap((ws) => ws.groups.flatMap((g) => g.items))
  return { workspaces, flat }
}
