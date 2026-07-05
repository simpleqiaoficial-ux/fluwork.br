// Server-only — usa @react-pdf/renderer (Node), nunca importar de um client component.
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer"
import type { DadosAditivo } from "@/lib/contracts/montar-dados-aditivo"

const styles = StyleSheet.create({
  page: { paddingTop: 70, paddingBottom: 50, paddingHorizontal: 48, fontSize: 10, fontFamily: "Helvetica" },
  header: {
    position: "absolute",
    top: 20,
    left: 48,
    right: 48,
    textAlign: "center",
    borderBottom: "1 solid #ddd",
    paddingBottom: 8,
  },
  headerLogo: { height: 28, marginBottom: 4, alignSelf: "center" },
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
  campoLabel: { color: "#666", width: 100 },
  campoValor: { fontWeight: 700, flex: 1 },
  tabela: { marginTop: 12, marginBottom: 12, borderRadius: 4, border: "1 solid #ddd" },
  tabelaLinha: { flexDirection: "row", borderBottom: "1 solid #eee", padding: 6 },
  tabelaHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", padding: 6, fontWeight: 700 },
  tabelaCol: { flex: 1 },
  clausula: { marginBottom: 8, lineHeight: 1.4, textAlign: "justify" },
  assinaturaBox: { marginTop: 16, padding: 10, backgroundColor: "#eef2ff", borderRadius: 4 },
  assinaturaLabel: { fontSize: 8, fontWeight: 700, color: "#444", marginBottom: 4, textTransform: "uppercase" },
})

function AditivoDocument({ dados }: { dados: DadosAditivo }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {dados.empresa.logoUrl && <Image style={styles.headerLogo} src={dados.empresa.logoUrl} />}
          <Text style={styles.headerMarca}>{dados.empresa.nomeFantasia || dados.empresa.razaoSocial}</Text>
          <Text style={styles.headerLinha}>{dados.empresa.razaoSocial} · CNPJ {dados.empresa.cnpj}</Text>
        </View>

        <Text style={styles.titulo}>Termo Aditivo — {dados.tipoLabel}</Text>
        <Text style={styles.subtitulo}>
          Referente ao contrato nº {dados.numeroContrato} · Versão {dados.versao}
        </Text>

        <View style={{ marginBottom: 12 }}>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>Prestador:</Text>
            <Text style={styles.campoValor}>{dados.prestador.nome}</Text>
          </View>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>CPF/CNPJ:</Text>
            <Text style={styles.campoValor}>{dados.prestador.cpfCnpj}</Text>
          </View>
        </View>

        <Text style={styles.clausula}>
          Pelo presente termo aditivo, as partes do contrato de prestação de serviços nº {dados.numeroContrato} acordam
          as alterações abaixo, permanecendo inalteradas as demais cláusulas do contrato original.
        </Text>

        {dados.descricao && <Text style={styles.clausula}>{dados.descricao}</Text>}

        {dados.alteracoes.length > 0 && (
          <View style={styles.tabela}>
            <View style={styles.tabelaHeader}>
              <Text style={styles.tabelaCol}>Campo</Text>
              <Text style={styles.tabelaCol}>De</Text>
              <Text style={styles.tabelaCol}>Para</Text>
            </View>
            {dados.alteracoes.map((alteracao, i) => (
              <View key={i} style={styles.tabelaLinha}>
                <Text style={styles.tabelaCol}>{alteracao.campo}</Text>
                <Text style={styles.tabelaCol}>{alteracao.de}</Text>
                <Text style={[styles.tabelaCol, { fontWeight: 700 }]}>{alteracao.para}</Text>
              </View>
            ))}
          </View>
        )}

        {dados.assinatura && (
          <View style={styles.assinaturaBox}>
            <Text style={styles.assinaturaLabel}>Assinatura eletrônica</Text>
            <Text style={{ marginBottom: 2 }}>
              Assinado eletronicamente por {dados.assinatura.nome} ({dados.assinatura.cpfCnpj})
            </Text>
            <Text style={{ marginBottom: 2, color: "#444" }}>E-mail: {dados.assinatura.email}</Text>
            <Text style={{ color: "#444" }}>
              Data/hora: {dados.assinatura.dataHoraFormatada} · IP: {dados.assinatura.ip}
            </Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Aditivo ao contrato nº {dados.numeroContrato}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function gerarPdfAditivo(dados: DadosAditivo): Promise<Buffer> {
  return renderToBuffer(<AditivoDocument dados={dados} />)
}
