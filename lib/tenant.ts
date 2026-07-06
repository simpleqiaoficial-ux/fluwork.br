import { getUsuarioLogado } from "@/lib/auth-utils"
import { getSession, type SessionData } from "@/lib/session"

// Helpers centrais de isolamento multi-tenant. Toda Server Action que lê/escreve dado de
// empresa cliente deve passar por um destes em vez de reimplementar a checagem na mão —
// é exatamente a checagem espalhada/inconsistente em ~24 arquivos que este arquivo substitui.

export type UsuarioAutenticado = NonNullable<Awaited<ReturnType<typeof getUsuarioLogado>>>

/** Usuário autenticado ou `null` — não lança erro, quem chama decide o que fazer. */
export async function getCurrentUser(): Promise<UsuarioAutenticado | null> {
  return getUsuarioLogado()
}

/** Exige um usuário autenticado; lança erro genérico se não houver sessão válida. */
async function requireUser(): Promise<UsuarioAutenticado> {
  const usuario = await getCurrentUser()
  if (!usuario) throw new Error("Não autenticado")
  return usuario
}

/** Exige que o usuário logado seja o SuperAdmin (time FluWork, acesso a todas as empresas). */
export async function requireSuperAdmin(): Promise<UsuarioAutenticado> {
  const usuario = await requireUser()
  if (usuario.tipo_acesso !== "SuperAdmin") {
    throw new Error("Apenas o administrador FluWork pode acessar este recurso")
  }
  return usuario
}

/**
 * Exige que o usuário logado seja SuperAdmin OU pertença exatamente à empresa `empresaId`.
 * Uso típico: antes de criar/editar um recurso que já se sabe de qual empresa é.
 */
export async function requireCompanyAccess(empresaId: string): Promise<UsuarioAutenticado> {
  const usuario = await requireUser()
  if (usuario.tipo_acesso === "SuperAdmin") return usuario
  if (usuario.empresa_id !== empresaId) {
    throw new Error("Sem permissão para acessar dados de outra empresa")
  }
  return usuario
}

export interface TenantScope {
  usuario: UsuarioAutenticado
  isSuperAdmin: boolean
  /** null apenas quando isSuperAdmin e não está impersonando — nesse caso o chamador decide
   *  se filtra por alguma empresa específica ou busca todas. */
  empresaId: string | null
}

/**
 * Deriva o escopo de tenant do usuário logado. Toda função "listarX()" de Server Action deve
 * usar isto para montar seu `where`: `isSuperAdmin ? (sem filtro, ou filtro opcional) : eq(empresaId, scope.empresaId)`.
 */
export async function getTenantScope(): Promise<TenantScope> {
  const usuario = await requireUser()
  const isSuperAdmin = usuario.tipo_acesso === "SuperAdmin"
  return { usuario, isSuperAdmin, empresaId: getEffectiveEmpresaId(usuario) }
}

/**
 * Empresa "efetiva" pra escopo de leitura: a própria empresa do usuário, ou — se ele for
 * SuperAdmin — `null` (vê tudo) a menos que esteja em modo "visualizar como empresa", caso
 * em que passa a enxergar só aquela empresa. Substitui o padrão espalhado
 * `usuario.tipo_acesso === "SuperAdmin" ? undefined : eq(empresaId, usuario.empresa_id!)`
 * em ~15 Server Actions — a diferença é só que aqui o SuperAdmin impersonando deixa de cair
 * no branch "undefined" (ver todos os pontos que usam esse padrão).
 */
export function getEffectiveEmpresaId(usuario: Pick<UsuarioAutenticado, "tipo_acesso" | "empresa_id"> & { view_as_empresa_id?: string | null }): string | null {
  if (usuario.tipo_acesso !== "SuperAdmin") return usuario.empresa_id
  return usuario.view_as_empresa_id ?? null
}

/** Mesma ideia de `getEffectiveEmpresaId`, mas a partir do objeto de sessão cru (camelCase) —
 *  usado nos Server Actions que checam `session.tipoAcesso`/`session.empresaId` direto em vez
 *  de passar por `getUsuarioLogado()`. */
export function getEffectiveEmpresaIdFromSession(session: Pick<SessionData, "tipoAcesso" | "empresaId" | "viewAsEmpresaId">): string | null {
  if (session.tipoAcesso !== "SuperAdmin") return session.empresaId
  return session.viewAsEmpresaId ?? null
}

/**
 * Bloqueia mutação quando o SuperAdmin está em modo "visualizar como empresa" (somente
 * leitura). Chamar no início de toda função de escrita que — por causa do espelho do banco
 * (Fases 3–6) — já deixa "SuperAdmin" passar no gate de papel; sem isso, impersonar uma
 * empresa também daria acesso de escrita aos dados dela.
 */
export async function assertNaoImpersonando(): Promise<void> {
  const session = await getSession()
  if (session?.tipoAcesso === "SuperAdmin" && session.viewAsEmpresaId) {
    throw new Error("Ação bloqueada: você está em modo de visualização (somente leitura)")
  }
}

/**
 * Guard de página (não de Server Action): true se o usuário tem um dos papéis exigidos, OU
 * se é o SuperAdmin visualizando como uma empresa (somente leitura) — usado nos `page.tsx`
 * hoje restritos a Adm/Financeiro/etc, que sem isso rejeitariam o SuperAdmin impersonando.
 */
export function podeVisualizarPagina(usuario: UsuarioAutenticado, papeis: string[]): boolean {
  if (papeis.includes(usuario.tipo_acesso)) return true
  return usuario.tipo_acesso === "SuperAdmin" && !!usuario.view_as_empresa_id
}

/**
 * Confere se um recurso já buscado (por id cru) pertence à empresa do usuário logado.
 * Usar depois de um `SELECT ... WHERE id = ?` (nunca confiar em empresa_id vindo do frontend) —
 * essencial nas funções que buscam por id (getContratoById, enviarContrato, etc.), que hoje
 * não checam dono nenhum e permitem enumeração entre empresas.
 */
export async function assertSameCompany(resourceEmpresaId: string | null): Promise<UsuarioAutenticado> {
  const usuario = await requireUser()
  if (usuario.tipo_acesso === "SuperAdmin") return usuario
  if (!resourceEmpresaId || usuario.empresa_id !== resourceEmpresaId) {
    throw new Error("Sem permissão para acessar este recurso")
  }
  return usuario
}
