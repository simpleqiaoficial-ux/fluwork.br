// Nomes exibidos na interface pros papéis de acesso — puramente de apresentação, nunca usados
// em comparações/lógica. O valor técnico (tipo_acesso, permissões, enum do banco) continua
// "Colaborador"/"Supervisor"/"Gerente"/"Financeiro"/"Adm"/"SuperAdmin" em todo o código; só o
// texto visível na tela muda, pra evitar linguagem que sugira vínculo empregatício.
export const PAPEL_LABELS: Record<string, string> = {
  Colaborador: "Prestador",
  Supervisor: "Lançador de Ordem",
  Gerente: "1º Aprovador",
  Financeiro: "Aprovador Final",
  Adm: "Administrador",
  SuperAdmin: "SuperAdmin",
}

export function getPapelLabel(tipoAcesso?: string | null): string {
  if (!tipoAcesso) return "—"
  return PAPEL_LABELS[tipoAcesso] || tipoAcesso
}
