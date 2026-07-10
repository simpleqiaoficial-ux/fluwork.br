import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { ehsPapelPermissoes, ehsPermissoes } from "@/lib/db/schema"

export interface PermissaoDef {
  recurso: string
  acao: string
  label: string
}

// Catálogo de permissões do módulo EHS — cada linha é uma ação independente por recurso.
// Papéis futuros só precisam de linhas novas em ehs_papel_permissoes (via seedPermissoesEhs
// ou um cadastro de permissões mais tarde), sem mexer neste código nem fazer deploy.
export const EHS_PERMISSOES: PermissaoDef[] = [
  { recurso: "cliente", acao: "visualizar", label: "Visualizar Cliente" },
  { recurso: "cliente", acao: "criar", label: "Criar Cliente" },
  { recurso: "cliente", acao: "editar", label: "Editar Cliente" },
  { recurso: "cliente", acao: "excluir", label: "Excluir Cliente" },
  { recurso: "prestador", acao: "visualizar", label: "Visualizar Prestador" },
  { recurso: "prestador", acao: "editar", label: "Editar Prestador" },
  { recurso: "integracao", acao: "visualizar", label: "Visualizar Integração" },
  { recurso: "integracao", acao: "agendar", label: "Agendar Integração" },
  { recurso: "integracao", acao: "criar", label: "Criar Integração" },
  { recurso: "integracao", acao: "cancelar", label: "Cancelar Integração" },
  { recurso: "documento", acao: "visualizar", label: "Visualizar Documento" },
  { recurso: "documento", acao: "criar", label: "Enviar Documento" },
  { recurso: "documento", acao: "aprovar", label: "Aprovar Documento" },
  { recurso: "documento", acao: "rejeitar", label: "Rejeitar Documento" },
  { recurso: "documento", acao: "excluir", label: "Excluir Documento" },
  { recurso: "dashboard", acao: "visualizar", label: "Visualizar Dashboard" },
  { recurso: "relatorio", acao: "exportar", label: "Exportar Relatório" },
  { recurso: "email", acao: "enviar", label: "Enviar E-mail" },
  { recurso: "timeline", acao: "visualizar", label: "Visualizar Timeline" },
  { recurso: "auditoria", acao: "visualizar", label: "Visualizar Auditoria" },
]

// Papéis com acesso total ao módulo hoje — "acesso total" aqui não é um bypass no código, é
// literalmente ter todas as linhas de EHS_PERMISSOES concedidas em ehs_papel_permissoes. Um
// papel novo com acesso parcial no futuro só precisa de um seed diferente, não de código novo.
const PAPEIS_ACESSO_TOTAL = ["EHS", "Adm", "SuperAdmin"]

/** Garante que o catálogo de permissões existe no banco e que os papéis com acesso total ao
 *  módulo têm todas concedidas. Idempotente — seguro chamar em toda carga do dashboard EHS,
 *  não duplica linhas. */
export async function seedPermissoesEhs() {
  for (const def of EHS_PERMISSOES) {
    const [existente] = await db
      .select({ id: ehsPermissoes.id })
      .from(ehsPermissoes)
      .where(and(eq(ehsPermissoes.recurso, def.recurso), eq(ehsPermissoes.acao, def.acao)))

    const permissaoId = existente
      ? existente.id
      : (await db.insert(ehsPermissoes).values(def).returning({ id: ehsPermissoes.id }))[0].id

    for (const papel of PAPEIS_ACESSO_TOTAL) {
      const [jaTem] = await db
        .select({ id: ehsPapelPermissoes.id })
        .from(ehsPapelPermissoes)
        .where(and(eq(ehsPapelPermissoes.papel, papel), eq(ehsPapelPermissoes.permissaoId, permissaoId)))
      if (!jaTem) {
        await db.insert(ehsPapelPermissoes).values({ papel, permissaoId })
      }
    }
  }
}

/** Checagem fina de permissão — usada em toda Server Action/Server Component do módulo EHS. */
export async function hasPermission(tipoAcesso: string | undefined, recurso: string, acao: string): Promise<boolean> {
  if (!tipoAcesso) return false
  const [permissao] = await db
    .select({ id: ehsPapelPermissoes.id })
    .from(ehsPapelPermissoes)
    .innerJoin(ehsPermissoes, eq(ehsPapelPermissoes.permissaoId, ehsPermissoes.id))
    .where(and(eq(ehsPapelPermissoes.papel, tipoAcesso), eq(ehsPermissoes.recurso, recurso), eq(ehsPermissoes.acao, acao)))
  return Boolean(permissao)
}

/** Lança erro se o papel não tiver a permissão — usar no topo de Server Actions do módulo EHS,
 *  mesmo estilo de checkPermission()/exigirAdmin() já usados no resto do app. */
export async function exigirPermissaoEhs(tipoAcesso: string | undefined, recurso: string, acao: string) {
  if (!(await hasPermission(tipoAcesso, recurso, acao))) {
    throw new Error("Você não tem permissão para realizar esta ação no módulo EHS")
  }
}
