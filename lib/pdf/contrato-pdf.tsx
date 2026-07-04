// Server-only — usa @react-pdf/renderer (Node), nunca importar de um client component.
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer"
import type { DadosContrato } from "@/lib/contracts/montar-dados-contrato"

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
  campoLabel: { color: "#666", width: 90 },
  campoValor: { fontWeight: 700, flex: 1 },
  clausula: { marginBottom: 8, lineHeight: 1.4, textAlign: "justify" },
  assinaturaBox: { marginTop: 16, padding: 10, backgroundColor: "#eef2ff", borderRadius: 4 },
  assinaturaLabel: { fontSize: 8, fontWeight: 700, color: "#444", marginBottom: 4, textTransform: "uppercase" },
})

function ContratoDocument({ dados }: { dados: DadosContrato }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {dados.empresa.logoUrl && <Image style={styles.headerLogo} src={dados.empresa.logoUrl} />}
          <Text style={styles.headerMarca}>{dados.empresa.nomeFantasia || dados.empresa.razaoSocial}</Text>
          <Text style={styles.headerLinha}>
            {dados.empresa.razaoSocial} · CNPJ {dados.empresa.cnpj}
          </Text>
        </View>

        <Text style={styles.titulo}>Contrato de Prestação de Serviços</Text>
        <Text style={styles.subtitulo}>
          Nº {dados.numero} · Versão {dados.versaoAtual}
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
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>E-mail:</Text>
            <Text style={styles.campoValor}>{dados.prestador.email}</Text>
          </View>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>Endereço:</Text>
            <Text style={styles.campoValor}>{dados.prestador.endereco}</Text>
          </View>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>Serviço:</Text>
            <Text style={styles.campoValor}>{dados.tipoServico}</Text>
          </View>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>Valor:</Text>
            <Text style={styles.campoValor}>{dados.valorFormatado}</Text>
          </View>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>Prazo:</Text>
            <Text style={styles.campoValor}>{dados.prazo}</Text>
          </View>
          <View style={styles.campoLinha}>
            <Text style={styles.campoLabel}>Início:</Text>
            <Text style={styles.campoValor}>{dados.dataInicioFormatada}</Text>
          </View>
        </View>

        {dados.clausulas.map((clausula, i) => (
          <Text key={i} style={styles.clausula}>{clausula}</Text>
        ))}

        {dados.clausulasAdicionais && (
          <Text style={styles.clausula}>
            <Text style={{ fontWeight: 700 }}>CLÁUSULA ADICIONAL: </Text>
            {dados.clausulasAdicionais}
          </Text>
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
          <Text>Contrato nº {dados.numero}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function gerarPdfRascunho(dados: DadosContrato): Promise<Buffer> {
  return renderToBuffer(<ContratoDocument dados={dados} />)
}

export async function gerarPdfAssinado(dados: DadosContrato): Promise<Buffer> {
  if (!dados.assinatura) {
    throw new Error("Dados de assinatura ausentes para gerar o PDF assinado")
  }
  return renderToBuffer(<ContratoDocument dados={dados} />)
}
