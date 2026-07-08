// Resolve o código de município IBGE (7 dígitos) a partir de cidade + UF, via API pública
// do IBGE (sem chave). Usado pra preencher codigo_municipio_ibge de empresas/colaboradores
// na primeira emissão de NFS-e — o resultado é cacheado na própria coluna, então isso só
// roda quando o valor ainda não foi resolvido.

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
}

export async function resolverCodigoMunicipio(cidade: string, uf: string): Promise<string | null> {
  if (!cidade?.trim() || !uf?.trim()) return null

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf.trim().toUpperCase()}/municipios`,
      { cache: "force-cache" },
    )
    if (!response.ok) return null

    const municipios: Array<{ id: number; nome: string }> = await response.json()
    const alvo = normalizar(cidade)
    const encontrado = municipios.find((m) => normalizar(m.nome) === alvo)
    return encontrado ? String(encontrado.id) : null
  } catch (error) {
    console.error("[v0] Erro ao resolver código de município IBGE:", error)
    return null
  }
}
