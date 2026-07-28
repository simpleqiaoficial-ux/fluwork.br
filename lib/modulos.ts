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

// Só financeiro e ehs precisam de lista de rotas pra gate por página — contratos bloqueado
// é tratado como bloqueio da empresa inteira (mesmo mecanismo de empresas.status, ver
// app/layout.tsx), não faz sentido listar rota por rota.
export type ModuloComRotas = Exclude<Modulo, "contratos">

const MODULO_ROTAS: Record<ModuloComRotas, string[]> = {
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
  ehs: ["/ehs"],
}

export interface BloqueioModulo {
  motivo: string
  bloqueadoEm: Date | null
}

export type ModulosBloqueados = Record<Modulo, BloqueioModulo | null>

export const NENHUM_BLOQUEIO: ModulosBloqueados = { financeiro: null, contratos: null, ehs: null }

/** A qual módulo (financeiro/ehs) uma rota pertence, se houver — usado pelo gate em
 *  app/layout.tsx pra decidir se troca o conteúdo da página por um aviso de bloqueio. */
export function moduloDaRota(pathname: string): ModuloComRotas | null {
  for (const modulo of Object.keys(MODULO_ROTAS) as ModuloComRotas[]) {
    if (MODULO_ROTAS[modulo].some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))) {
      return modulo
    }
  }
  return null
}
