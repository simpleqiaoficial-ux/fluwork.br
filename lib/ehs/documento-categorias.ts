// Catálogo de categorias/tipos de documento — sem dependência de banco, importável tanto por
// Server quanto Client Components (lib/ehs/tipos-documento.ts cuida do seed no banco).

export interface TipoDocumentoSeed {
  nome: string
  categoria: "aso" | "nr" | "certificado" | "curso" | "treinamento" | "exame" | "epi" | "documento"
}

export const TIPOS_DOCUMENTO_SEED: TipoDocumentoSeed[] = [
  { nome: "ASO", categoria: "aso" },
  { nome: "NR-10", categoria: "nr" },
  { nome: "NR-12", categoria: "nr" },
  { nome: "NR-18", categoria: "nr" },
  { nome: "NR-33", categoria: "nr" },
  { nome: "NR-35", categoria: "nr" },
  { nome: "Certificado", categoria: "certificado" },
  { nome: "Curso", categoria: "curso" },
  { nome: "Treinamento", categoria: "treinamento" },
  { nome: "Exame Toxicológico", categoria: "exame" },
  { nome: "EPI", categoria: "epi" },
  { nome: "Documento Geral", categoria: "documento" },
]

export const CATEGORIA_LABELS: Record<string, string> = {
  aso: "ASO",
  nr: "NRs",
  certificado: "Certificados",
  curso: "Cursos",
  treinamento: "Treinamentos",
  exame: "Exames",
  epi: "EPIs",
  documento: "Documentos gerais",
}
