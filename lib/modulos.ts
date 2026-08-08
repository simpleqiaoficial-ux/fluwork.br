// Registro central dos 3 módulos comerciais que o SuperAdmin pode liberar/bloquear por
// empresa (independente do papel do usuário — isso já existe via middleware/nav-config).
//
// Este arquivo é importado por componentes client (components/admin/empresa-detail.tsx,
// components/admin/modulos-admin-list.tsx) — por isso só tem constantes/tipos puros, sem
// nenhum import de lib/db (que puxa o driver `pg`, Node-only, e quebra o build do client
// bundle). As funções que tocam o banco ficam em lib/modulos-server.ts.

export const MODULOS = ["financeiro", "contratos", "ehs"] as const
export type Modulo = (typeof MODULOS)[number]

export const MODULO_LABELS: Record<Modulo, string> = {
  financeiro: "Financeiro",
  contratos: "Contratos",
  ehs: "EHS & Compliance",
}

const MODULO_ROTAS: Record<Modulo, string[]> = {
  financeiro: [
    "/pedidos",
    "/historico",
    "/historico-completo",
    "/aprovacoes",
    "/acompanhamento",
    "/financeiro",
    "/meus-pagamentos",
    "/gestao/notas",
    "/fiscal",
  ],
  // "/contratos/assinar" fica de fora (ver moduloDaRota) — é o link público de assinatura,
  // que pode ser aberto por um prestador sem sessão nenhuma e não deve depender do módulo
  // Contratos estar liberado pra essa empresa continuar sendo válido.
  contratos: ["/contratos", "/meus-contratos"],
  ehs: ["/ehs"],
}

export interface BloqueioModulo {
  motivo: string
  bloqueadoEm: Date | null
}

export type ModulosBloqueados = Record<Modulo, BloqueioModulo | null>

export const NENHUM_BLOQUEIO: ModulosBloqueados = { financeiro: null, contratos: null, ehs: null }

/** A qual módulo uma rota pertence, se houver — usado pelo gate em app/layout.tsx pra decidir
 *  se troca o conteúdo da página por um aviso de bloqueio (mantendo sidebar/header, nunca
 *  bloqueando a empresa inteira — cada módulo bloqueia só a área dele). */
export function moduloDaRota(pathname: string): Modulo | null {
  if (pathname.startsWith("/contratos/assinar")) return null

  for (const modulo of Object.keys(MODULO_ROTAS) as Modulo[]) {
    if (MODULO_ROTAS[modulo].some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))) {
      return modulo
    }
  }
  return null
}
