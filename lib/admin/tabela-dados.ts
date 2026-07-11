import { count, desc, getTableColumns } from "drizzle-orm"
import { db } from "@/lib/db"

// Colunas que nunca aparecem em claro no Espelho de Dados, não importa a tabela — são
// segredo de autenticação (hash de senha, token de sessão/recuperação), sem nenhum valor
// diagnóstico e com risco real se um print dessa tela vazar.
const COLUNAS_REDIGIDAS = new Set(["senha_hash", "reset_token", "token_hash"])

export interface ColunaInfo {
  chave: string
  nomeDb: string
  redigida: boolean
}

export interface DadosTabela {
  colunas: ColunaInfo[]
  linhas: Record<string, unknown>[]
  total: number
  pagina: number
  porPagina: number
}

/** Leitura genérica de qualquer tabela do schema — colunas vêm por introspecção
 *  (getTableColumns), então funciona pra tabela nova sem precisar escrever nada específico.
 *  Somente leitura: não existe (e não deve existir) um caminho de escrita aqui. */
export async function buscarDadosTabela(table: any, pagina: number, porPagina = 50): Promise<DadosTabela> {
  const colunasObj = getTableColumns(table)
  const colunas: ColunaInfo[] = Object.entries(colunasObj).map(([chave, coluna]: [string, any]) => ({
    chave,
    nomeDb: coluna.name,
    redigida: COLUNAS_REDIGIDAS.has(coluna.name),
  }))

  const [{ total }] = await db.select({ total: count() }).from(table)

  const paginaSegura = Math.max(1, pagina)
  const offset = (paginaSegura - 1) * porPagina
  const ordenacao = colunasObj.createdAt ?? colunasObj.id

  const linhasRaw = ordenacao
    ? await db.select().from(table).orderBy(desc(ordenacao)).limit(porPagina).offset(offset)
    : await db.select().from(table).limit(porPagina).offset(offset)

  const linhas = linhasRaw.map((linha: Record<string, unknown>) => {
    const linhaFormatada: Record<string, unknown> = {}
    for (const coluna of colunas) {
      linhaFormatada[coluna.chave] = coluna.redigida ? (linha[coluna.chave] ? "••••••••" : null) : linha[coluna.chave]
    }
    return linhaFormatada
  })

  return { colunas, linhas, total: Number(total), pagina: paginaSegura, porPagina }
}
