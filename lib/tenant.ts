import { getUsuarioLogado } from "@/lib/auth-utils"

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
  /** null apenas quando isSuperAdmin — nesse caso o chamador decide se filtra por alguma
   *  empresa específica (ex: painel "entrar na empresa X") ou busca todas. */
  empresaId: string | null
}

/**
 * Deriva o escopo de tenant do usuário logado. Toda função "listarX()" de Server Action deve
 * usar isto para montar seu `where`: `isSuperAdmin ? (sem filtro, ou filtro opcional) : eq(empresaId, scope.empresaId)`.
 */
export async function getTenantScope(): Promise<TenantScope> {
  const usuario = await requireUser()
  const isSuperAdmin = usuario.tipo_acesso === "SuperAdmin"
  return { usuario, isSuperAdmin, empresaId: isSuperAdmin ? null : usuario.empresa_id }
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
