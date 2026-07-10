// Server-only — usa @react-pdf/renderer (Node), nunca importar de um client component.
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer"

export interface DadosRelatorioPrestadorEhs {
  empresa: { nome: string; cnpj?: string | null }
  prestador: { nome: string; cnpj?: string | null; email?: string | null }
  geradoEm: string
  compliance: { score: number | null; validos: number; vencidos: number; proximosVencer: number; total: number }
  documentos: Array<{
    nome: string
    categoria: string
    status: string
    versao: number
    dataEmissaoFormatada: string
    dataValidadeFormatada: string
    situacaoLabel: string
  }>
}

const styles = StyleSheet.create({
  page: { paddingTop: 60, paddingBottom: 50, paddingHorizontal: 48, fontSize: 9, fontFamily: "Helvetica" },
  header: {
    position: "absolute",
    top: 20,
    left: 48,
    right: 48,
    textAlign: "center",
    borderBottom: "1 solid #ddd",
    paddingBottom: 8,
  },
  headerMarca: { fontSize: 12, fontWeight: 700 },
  headerLinha: { fontSize: 8, color: "#666", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    borderTop: "1 solid #ddd",
    paddingTop: 6,
    fontSize: 8,
    color: "#666",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titulo: { fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 4 },
  subtitulo: { fontSize: 9, color: "#666", textAlign: "center", marginBottom: 16 },
  campoLinha: { flexDirection: "row", marginBottom: 3 },
  campoLabel: { color: "#666", width: 90 },
  campoValor: { fontWeight: 700, flex: 1 },
  scoreBox: { marginTop: 12, marginBottom: 16, padding: 10, backgroundColor: "#f4f4f5", borderRadius: 4, flexDirection: "row", justifyContent: "space-around" },
  scoreItem: { alignItems: "center" },
  scoreValor: { fontSize: 16, fontWeight: 700 },
  scoreLabel: { fontSize: 7, color: "#666", marginTop: 2, textTransform: "uppercase" },
  tabelaHeader: { flexDirection: "row", backgroundColor: "#eef2ff", paddingVertical: 5, paddingHorizontal: 4, fontWeight: 700 },
  tabelaLinha: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 4, borderBottom: "1 solid #eee" },
  colNome: { width: "26%" },
  colCategoria: { width: "16%" },
  colStatus: { width: "16%" },
  colVersao: { width: "10%" },
  colEmissao: { width: "16%" },
  colValidade: { width: "16%" },
})

function RelatorioPrestadorDocument({ dados }: { dados: DadosRelatorioPrestadorEhs }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerMarca}>{dados.empresa.nome}</Text>
          {dados.empresa.cnpj && <Text style={styles.headerLinha}>CNPJ {dados.empresa.cnpj}</Text>}
        </View>

        <Text style={styles.titulo}>Relatório de Compliance — {dados.prestador.nome}</Text>
        <Text style={styles.subtitulo}>Gerado em {dados.geradoEm}</Text>

        <View style={{ marginBottom: 4 }}>
          {dados.prestador.cnpj && (
            <View style={styles.campoLinha}>
              <Text style={styles.campoLabel}>CPF/CNPJ:</Text>
              <Text style={styles.campoValor}>{dados.prestador.cnpj}</Text>
            </View>
          )}
          {dados.prestador.email && (
            <View style={styles.campoLinha}>
              <Text style={styles.campoLabel}>E-mail:</Text>
              <Text style={styles.campoValor}>{dados.prestador.email}</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreBox}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValor}>{dados.compliance.score === null ? "—" : `${dados.compliance.score}%`}</Text>
            <Text style={styles.scoreLabel}>Compliance Score</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValor}>{dados.compliance.validos}</Text>
            <Text style={styles.scoreLabel}>Válidos</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValor}>{dados.compliance.vencidos}</Text>
            <Text style={styles.scoreLabel}>Vencidos</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValor}>{dados.compliance.proximosVencer}</Text>
            <Text style={styles.scoreLabel}>Vencendo em breve</Text>
          </View>
        </View>

        <View style={styles.tabelaHeader}>
          <Text style={styles.colNome}>Documento</Text>
          <Text style={styles.colCategoria}>Categoria</Text>
          <Text style={styles.colStatus}>Situação</Text>
          <Text style={styles.colVersao}>Versão</Text>
          <Text style={styles.colEmissao}>Emissão</Text>
          <Text style={styles.colValidade}>Validade</Text>
        </View>
        {dados.documentos.map((documento, i) => (
          <View key={i} style={styles.tabelaLinha}>
            <Text style={styles.colNome}>{documento.nome}</Text>
            <Text style={styles.colCategoria}>{documento.categoria}</Text>
            <Text style={styles.colStatus}>{documento.situacaoLabel}</Text>
            <Text style={styles.colVersao}>{documento.versao || "—"}</Text>
            <Text style={styles.colEmissao}>{documento.dataEmissaoFormatada}</Text>
            <Text style={styles.colValidade}>{documento.dataValidadeFormatada}</Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>FluWork · Módulo EHS & Compliance</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function gerarRelatorioPrestadorPdf(dados: DadosRelatorioPrestadorEhs): Promise<Buffer> {
  return renderToBuffer(<RelatorioPrestadorDocument dados={dados} />)
}
