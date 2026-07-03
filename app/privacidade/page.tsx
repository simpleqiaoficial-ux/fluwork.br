import Link from "next/link"
import { ArrowLeft, Shield, Calendar, Mail, Phone, Info, CheckCircle } from "lucide-react"

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b border-gray-800">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar ao Login</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Login</Link>
            <Link href="/faq" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">FAQ</Link>
            <Link href="/termos" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Termos</Link>
            <Link href="/privacidade" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Politica de Privacidade</h1>
          <p className="text-gray-300 mb-4">FluxoPay - LGPD (Lei n 13.709/2018)</p>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Vigencia: 02/04/2026 | Versao 2.1 | CNPJ 26.344.386/0001-42</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 space-y-8">
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Controlador e Encarregado (DPO)</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              <strong className="text-white">Controlador dos Dados:</strong> FELIPE NOGUEIRA SILVA SERVICOS COMERCIO E LOCACAO, 
              CNPJ 26.344.386/0001-42, nome fantasia KAFERRI TEC SERVICOS, com sede em Osasco/SP, responsavel pelas 
              decisoes relativas ao tratamento de dados pessoais no FluxoPay.
            </p>
            <p className="text-gray-400 leading-relaxed mb-4">
              <strong className="text-white">Encarregado de Dados (DPO):</strong> simpleqia.oficial@gmail.com. O DPO e o canal 
              oficial para exercicio de direitos dos titulares, duvidas sobre o tratamento de dados e comunicacao com a ANPD.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                Para dados de prestadores inseridos pelas Empresas Clientes, a Empresa Cliente atua como Controladora 
                e o FluxoPay atua como Operadora, conforme Art. 37 da LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Dados Coletados e Finalidades</h2>
            
            <h3 className="text-lg font-medium text-white mb-3">2.1 Dados de Usuarios (colaboradores das Empresas Clientes)</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4 mb-4">
              <li><strong className="text-white">Identificacao:</strong> nome completo, e-mail corporativo, cargo</li>
              <li><strong className="text-white">Autenticacao:</strong> hash de senha (nunca a senha em texto claro), tokens de sessao</li>
              <li><strong className="text-white">Rastreabilidade:</strong> IP de acesso, dispositivo, navegador, data/hora de login e acoes</li>
            </ul>

            <h3 className="text-lg font-medium text-white mb-3">2.2 Dados de Prestadores de Servico</h3>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4 mb-4">
              <li>Dados cadastrais: nome/razao social, CPF/CNPJ, endereco, contatos</li>
              <li>Documentacao de habilitacao e qualificacao tecnica</li>
              <li>Dados bancarios para fins de pagamento (agencia, conta, banco)</li>
              <li>Historico de contratos, pagamentos e status de validacao</li>
            </ul>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-green-300 text-sm">
                Nao coletamos dados sensiveis (saude, biometria, etnia, orientacao sexual) e nao permitimos o cadastro 
                de dados de menores de 18 anos atraves do FluxoPay.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Base Legal do Tratamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white font-medium">Base Legal</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Artigo LGPD</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Aplicacao</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Execucao contratual</td>
                    <td className="py-3 px-4">Art. 7, V</td>
                    <td className="py-3 px-4">Autenticacao, acesso, gestao de prestadores</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Legitimo interesse</td>
                    <td className="py-3 px-4">Art. 7, IX</td>
                    <td className="py-3 px-4">Auditoria, seguranca, prevencao a fraudes</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Obrigacao legal</td>
                    <td className="py-3 px-4">Art. 7, II</td>
                    <td className="py-3 px-4">Retencao fiscal e trabalhista</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Consentimento</td>
                    <td className="py-3 px-4">Art. 7, I</td>
                    <td className="py-3 px-4">Funcionalidades opcionais - revogavel a qualquer tempo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Os dados sao compartilhados apenas nas seguintes hipoteses, todas com salvaguardas contratuais:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Provedores de infraestrutura de hospedagem, sob clausulas de confidencialidade</li>
              <li>Empresa Cliente - acesso exclusivo aos seus proprios dados</li>
              <li>Autoridades competentes quando exigido por lei ou ordem judicial</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">
                <strong>Proibido:</strong> O FluxoPay jamais vende, cede ou comercializa dados pessoais para terceiros 
                para fins de marketing, publicidade ou qualquer finalidade alheia ao servico contratado.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Transferencia Internacional de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Caso dados sejam processados em infraestrutura localizada fora do Brasil, o FluxoPay garante que tais 
              transferencias ocorrem apenas para paises com grau de protecao adequado reconhecido pela ANPD ou mediante 
              clausulas contratuais padrao, conforme Arts. 33 e seguintes da LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Retencao e Eliminacao de Dados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-white font-medium">Tipo de Dado</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Prazo de Retencao</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Logs de acesso e auditoria</td>
                    <td className="py-3 px-4">2 anos apos ultimo acesso</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Dados de prestadores e pagamentos</td>
                    <td className="py-3 px-4">5 anos (obrigacao fiscal)</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Dados de auditoria de fluxos</td>
                    <td className="py-3 px-4">5 anos (comprovacao e disputas)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Dados de usuarios desativados</td>
                    <td className="py-3 px-4">90 dias, salvo retencao legal</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Apos os prazos, eliminacao segura padrao NIST 800-88 ou anonimizacao irreversivel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Medidas de Seguranca</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
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
            <h2 className="text-xl font-semibold text-white mb-4">8. Direitos do Titular</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Conforme Art. 18 da LGPD, os titulares tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li><strong className="text-white">Confirmacao e Acesso</strong> - confirmar existencia e obter copia dos dados</li>
              <li><strong className="text-white">Correcao</strong> - atualizar dados incompletos, inexatos ou desatualizados</li>
              <li><strong className="text-white">Anonimizacao, Bloqueio ou Eliminacao</strong> - de dados desnecessarios ou em desconformidade</li>
              <li><strong className="text-white">Portabilidade</strong> - receber dados em formato estruturado e interoperavel</li>
              <li><strong className="text-white">Eliminacao</strong> - de dados tratados com base em consentimento</li>
              <li><strong className="text-white">Oposicao</strong> - ao tratamento baseado em legitimo interesse</li>
              <li><strong className="text-white">Revisao de decisoes automatizadas</strong> - solicitar revisao de decisoes por algoritmos</li>
              <li><strong className="text-white">Revogacao do consentimento</strong> - a qualquer tempo, sem prejuizo do tratamento anterior</li>
            </ul>
            <p className="text-gray-400 leading-relaxed">
              Para exercer qualquer direito, envie solicitacao para simpleqia.oficial@gmail.com com nome completo, 
              e-mail cadastrado e descricao do pedido. Prazo de resposta: 15 dias uteis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay utiliza exclusivamente cookies estritamente necessarios para:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Manutencao da sessao autenticada do usuario</li>
              <li>Seguranca (tokens CSRF e protecao contra ataques de sessao)</li>
              <li>Preferencias basicas de interface (idioma, tema)</li>
            </ul>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-green-300 text-sm">
                Nao utilizamos cookies de rastreamento, analytics comportamental ou publicidade. Todos os cookies 
                de sessao sao eliminados ao logout ou ao fechar o navegador.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Incidentes de Seguranca</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Em caso de incidente que possa afetar dados pessoais, o FluxoPay:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Notificara a Empresa Cliente no prazo maximo de 72 horas apos ciencia do evento</li>
              <li>Comunicara a ANPD nos termos do Art. 48 da LGPD, quando aplicavel</li>
              <li>Adotara medidas imediatas de contencao, remediacao e prevencao de recorrencia</li>
              <li>Fornecera relatorio de incidente com causa, dados afetados e medidas adotadas</li>
            </ul>
            <p className="text-gray-400 leading-relaxed">
              Para reportar incidentes: simpleqia.oficial@gmail.com ou (11) 91486-0806
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Atualizacoes desta Politica</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Esta Politica entra em vigor em 02/04/2026 e pode ser atualizada periodicamente. Alteracoes relevantes 
              serao comunicadas por e-mail com antecedencia minima de 15 dias. A versao vigente estara sempre disponivel 
              na tela de login do FluxoPay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:simpleqia.oficial@gmail.com"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                simpleqia.oficial@gmail.com
              </a>
              <a 
                href="https://wa.me/5511914860806"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                (11) 91486-0806
              </a>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>2025 FluxoPay - Simpleqia. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
<Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
