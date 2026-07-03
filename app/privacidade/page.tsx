import Link from "next/link"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
            <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">Termos</Link>
            <Link href="/privacidade" className="text-foreground font-medium">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center border-b">
        <h1 className="text-2xl font-semibold tracking-tight">Politica de Privacidade</h1>
        <p className="text-sm text-muted-foreground mt-2">FluWork - LGPD (Lei n 13.709/2018)</p>
        <p className="text-xs text-muted-foreground mt-3">
          Vigencia: 02/04/2026 · Versao 2.1 · CNPJ 26.344.386/0001-42
        </p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <section>
          <h2 className="text-base font-semibold mb-3">1. Controlador e Encarregado (DPO)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground font-medium">Controlador dos Dados:</strong> FELIPE NOGUEIRA SILVA SERVICOS COMERCIO E LOCACAO,
            CNPJ 26.344.386/0001-42, nome fantasia KAFERRI TEC SERVICOS, com sede em Osasco/SP, responsavel pelas
            decisoes relativas ao tratamento de dados pessoais no FluWork.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground font-medium">Encarregado de Dados (DPO):</strong> simpleqia.oficial@gmail.com. O DPO e o canal
            oficial para exercicio de direitos dos titulares, duvidas sobre o tratamento de dados e comunicacao com a ANPD.
          </p>
          <div className="border-l-2 border-border pl-4 py-1">
            <p className="text-sm text-muted-foreground">
              Para dados de prestadores inseridos pelas Empresas Clientes, a Empresa Cliente atua como Controladora
              e o FluWork atua como Operadora, conforme Art. 37 da LGPD.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-4">2. Dados Coletados e Finalidades</h2>

          <h3 className="text-sm font-medium text-foreground mb-2">2.1 Dados de Usuarios (colaboradores das Empresas Clientes)</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4 mb-4">
            <li><strong className="text-foreground font-medium">Identificacao:</strong> nome completo, e-mail corporativo, cargo</li>
            <li><strong className="text-foreground font-medium">Autenticacao:</strong> hash de senha (nunca a senha em texto claro), tokens de sessao</li>
            <li><strong className="text-foreground font-medium">Rastreabilidade:</strong> IP de acesso, dispositivo, navegador, data/hora de login e acoes</li>
          </ul>

          <h3 className="text-sm font-medium text-foreground mb-2">2.2 Dados de Prestadores de Servico</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4 mb-4">
            <li>Dados cadastrais: nome/razao social, CPF/CNPJ, endereco, contatos</li>
            <li>Documentacao de habilitacao e qualificacao tecnica</li>
            <li>Dados bancarios para fins de pagamento (agencia, conta, banco)</li>
            <li>Historico de contratos, pagamentos e status de validacao</li>
          </ul>

          <div className="border-l-2 border-success pl-4 py-1">
            <p className="text-sm text-muted-foreground">
              Nao coletamos dados sensiveis (saude, biometria, etnia, orientacao sexual) e nao permitimos o cadastro
              de dados de menores de 18 anos atraves do FluWork.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">3. Base Legal do Tratamento</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Base Legal</TableHead>
                <TableHead>Artigo LGPD</TableHead>
                <TableHead>Aplicacao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm">Execucao contratual</TableCell>
                <TableCell className="text-sm text-muted-foreground">Art. 7, V</TableCell>
                <TableCell className="text-sm text-muted-foreground">Autenticacao, acesso, gestao de prestadores</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">Legitimo interesse</TableCell>
                <TableCell className="text-sm text-muted-foreground">Art. 7, IX</TableCell>
                <TableCell className="text-sm text-muted-foreground">Auditoria, seguranca, prevencao a fraudes</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">Obrigacao legal</TableCell>
                <TableCell className="text-sm text-muted-foreground">Art. 7, II</TableCell>
                <TableCell className="text-sm text-muted-foreground">Retencao fiscal e trabalhista</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">Consentimento</TableCell>
                <TableCell className="text-sm text-muted-foreground">Art. 7, I</TableCell>
                <TableCell className="text-sm text-muted-foreground">Funcionalidades opcionais - revogavel a qualquer tempo</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">4. Compartilhamento de Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Os dados sao compartilhados apenas nas seguintes hipoteses, todas com salvaguardas contratuais:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Provedores de infraestrutura de hospedagem, sob clausulas de confidencialidade</li>
            <li>Empresa Cliente - acesso exclusivo aos seus proprios dados</li>
            <li>Autoridades competentes quando exigido por lei ou ordem judicial</li>
          </ul>
          <div className="border-l-2 border-destructive pl-4 py-1">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground font-medium">Proibido:</strong> O FluWork jamais vende, cede ou comercializa dados pessoais para terceiros
              para fins de marketing, publicidade ou qualquer finalidade alheia ao servico contratado.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">5. Transferencia Internacional de Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Caso dados sejam processados em infraestrutura localizada fora do Brasil, o FluWork garante que tais
            transferencias ocorrem apenas para paises com grau de protecao adequado reconhecido pela ANPD ou mediante
            clausulas contratuais padrao, conforme Arts. 33 e seguintes da LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">6. Retencao e Eliminacao de Dados</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Dado</TableHead>
                <TableHead>Prazo de Retencao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm">Logs de acesso e auditoria</TableCell>
                <TableCell className="text-sm text-muted-foreground">2 anos apos ultimo acesso</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">Dados de prestadores e pagamentos</TableCell>
                <TableCell className="text-sm text-muted-foreground">5 anos (obrigacao fiscal)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">Dados de auditoria de fluxos</TableCell>
                <TableCell className="text-sm text-muted-foreground">5 anos (comprovacao e disputas)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm">Dados de usuarios desativados</TableCell>
                <TableCell className="text-sm text-muted-foreground">90 dias, salvo retencao legal</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">
            Apos os prazos, eliminacao segura padrao NIST 800-88 ou anonimizacao irreversivel.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">7. Medidas de Seguranca</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4">
            <li>Criptografia de dados em transito com TLS 1.3</li>
            <li>Criptografia de dados em repouso (AES-256)</li>
            <li>Hash de senhas com bcrypt, fator de custo &gt;= 12</li>
            <li>Controle de acesso baseado em perfis (RBAC) com principio do menor privilegio</li>
            <li>Logs de auditoria imutaveis com rastreabilidade completa</li>
            <li>Autenticacao multifator (MFA) obrigatorio para administradores</li>
            <li>Monitoramento continuo de anomalias e alertas automaticos</li>
            <li>Backups criptografados com retencao minima de 30 dias</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">8. Direitos do Titular</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Conforme Art. 18 da LGPD, os titulares tem direito a:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li><strong className="text-foreground font-medium">Confirmacao e Acesso</strong> - confirmar existencia e obter copia dos dados</li>
            <li><strong className="text-foreground font-medium">Correcao</strong> - atualizar dados incompletos, inexatos ou desatualizados</li>
            <li><strong className="text-foreground font-medium">Anonimizacao, Bloqueio ou Eliminacao</strong> - de dados desnecessarios ou em desconformidade</li>
            <li><strong className="text-foreground font-medium">Portabilidade</strong> - receber dados em formato estruturado e interoperavel</li>
            <li><strong className="text-foreground font-medium">Eliminacao</strong> - de dados tratados com base em consentimento</li>
            <li><strong className="text-foreground font-medium">Oposicao</strong> - ao tratamento baseado em legitimo interesse</li>
            <li><strong className="text-foreground font-medium">Revisao de decisoes automatizadas</strong> - solicitar revisao de decisoes por algoritmos</li>
            <li><strong className="text-foreground font-medium">Revogacao do consentimento</strong> - a qualquer tempo, sem prejuizo do tratamento anterior</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para exercer qualquer direito, envie solicitacao para simpleqia.oficial@gmail.com com nome completo,
            e-mail cadastrado e descricao do pedido. Prazo de resposta: 15 dias uteis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">9. Cookies e Tecnologias Similares</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O FluWork utiliza exclusivamente cookies estritamente necessarios para:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Manutencao da sessao autenticada do usuario</li>
            <li>Seguranca (tokens CSRF e protecao contra ataques de sessao)</li>
            <li>Preferencias basicas de interface (idioma, tema)</li>
          </ul>
          <div className="border-l-2 border-success pl-4 py-1">
            <p className="text-sm text-muted-foreground">
              Nao utilizamos cookies de rastreamento, analytics comportamental ou publicidade. Todos os cookies
              de sessao sao eliminados ao logout ou ao fechar o navegador.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">10. Incidentes de Seguranca</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Em caso de incidente que possa afetar dados pessoais, o FluWork:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Notificara a Empresa Cliente no prazo maximo de 72 horas apos ciencia do evento</li>
            <li>Comunicara a ANPD nos termos do Art. 48 da LGPD, quando aplicavel</li>
            <li>Adotara medidas imediatas de contencao, remediacao e prevencao de recorrencia</li>
            <li>Fornecera relatorio de incidente com causa, dados afetados e medidas adotadas</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para reportar incidentes: simpleqia.oficial@gmail.com ou (11) 91486-0806
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">11. Atualizacoes desta Politica</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Esta Politica entra em vigor em 02/04/2026 e pode ser atualizada periodicamente. Alteracoes relevantes
            serao comunicadas por e-mail com antecedencia minima de 15 dias. A versao vigente estara sempre disponivel
            na tela de login do FluWork.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:simpleqia.oficial@gmail.com"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              simpleqia.oficial@gmail.com
            </a>
            <a
              href="https://wa.me/5511914860806"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Phone className="h-4 w-4" />
              (11) 91486-0806
            </a>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>2026 FluWork - Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-foreground transition-colors">Termos</Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
