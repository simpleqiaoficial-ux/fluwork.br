import Link from "next/link"
import { ArrowLeft, FileText, Calendar, Mail, Phone, AlertTriangle, Info } from "lucide-react"

export default function TermosPage() {
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
            <Link href="/termos" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Termos</Link>
            <Link href="/privacidade" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Termos de Uso</h1>
          <p className="text-gray-300 mb-4">FluxoPay - Plataforma de Gestao de Prestadores de Servico</p>
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Ultima atualizacao: 02/04/2026 | Versao 2.1</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 space-y-8">
          
          {/* Declaracao */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-gray-300 italic text-center">
              "Declaro que li, compreendi e concordo com os Termos de Uso e a Politica de Privacidade do FluxoPay."
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Identificacao</h2>
            <p className="text-gray-400 leading-relaxed">
              O FluxoPay e uma plataforma digital operada por FELIPE NOGUEIRA SILVA SERVICOS COMERCIO E LOCACAO, 
              inscrita no CNPJ sob o n 26.344.386/0001-42, com nome fantasia KAFERRI TEC SERVICOS, com sede em 
              Osasco/SP, responsavel pelo desenvolvimento, manutencao e gestao da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Aceite dos Termos</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Ao acessar, utilizar ou se cadastrar na plataforma FluxoPay, o usuario declara que leu, compreendeu 
              e concorda integralmente com estes Termos de Uso e com a Politica de Privacidade aplicavel. O aceite 
              e condicao indispensavel para utilizacao do sistema.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                Caso o usuario nao concorde, total ou parcialmente, com quaisquer disposicoes aqui previstas, 
                devera abster-se imediatamente de utilizar a plataforma.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Objeto da Plataforma</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay consiste em uma plataforma digital voltada a gestao e organizacao de processos financeiros 
              corporativos, permitindo, entre outras funcionalidades:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Criacao, controle e acompanhamento de solicitacoes de pagamento</li>
              <li>Definicao e gestao de fluxos de aprovacao internos</li>
              <li>Anexacao, armazenamento e validacao de documentos</li>
              <li>Controle de prazos, status e responsaveis</li>
              <li>Registro e rastreabilidade de operacoes</li>
            </ul>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                O FluxoPay nao realiza movimentacoes financeiras, nao sendo instituicao financeira, banco, 
                intermediadora de pagamentos ou responsavel por execucoes de transferencias, limitando-se a 
                gestao e organizacao de informacoes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Cadastro e Acesso</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O acesso a plataforma e restrito a usuarios devidamente autorizados pela empresa contratante. 
              A gestao de usuarios, permissoes e acessos e de inteira responsabilidade da empresa contratante.
            </p>
            <p className="text-gray-400 leading-relaxed mb-2">O usuario compromete-se a:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Fornecer informacoes verdadeiras, completas e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Nao compartilhar login e senha com terceiros</li>
              <li>Utilizar a plataforma exclusivamente para fins legitimos e autorizados</li>
            </ul>
            <p className="text-gray-400 leading-relaxed">
              Toda atividade realizada na conta sera considerada de responsabilidade do usuario e/ou da empresa vinculada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Responsabilidades do Usuario</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O usuario declara estar ciente de que e exclusivamente responsavel por:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Todas as informacoes, dados e documentos inseridos na plataforma</li>
              <li>A veracidade, integridade e legalidade dos dados fornecidos</li>
              <li>As decisoes tomadas com base nas informacoes registradas</li>
              <li>O cumprimento de politicas internas, normas corporativas e legislacoes aplicaveis</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                E expressamente proibido: utilizar a plataforma para fins ilicitos, fraudulentos ou nao autorizados; 
                inserir informacoes falsas ou enganosas; tentar acessar areas restritas sem permissao; comprometer 
                a seguranca, estabilidade ou funcionamento do sistema.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Limitacao de Responsabilidade</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Na maxima extensao permitida pela legislacao aplicavel, o FluxoPay nao se responsabiliza por:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4 mb-4">
              <li>Erros, inconsistencias ou omissoes nas informacoes inseridas pelos usuarios</li>
              <li>Decisoes financeiras, operacionais ou estrategicas tomadas com base na plataforma</li>
              <li>Prejuizos decorrentes de uso indevido ou acesso nao autorizado</li>
              <li>Falhas decorrentes de credenciais comprometidas</li>
              <li>Indisponibilidade temporaria do sistema</li>
              <li>Falhas provenientes de terceiros, integracoes externas ou infraestrutura fora de seu controle</li>
            </ul>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">
                A utilizacao da plataforma e realizada por conta e risco do usuario e da empresa contratante.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Disponibilidade do Sistema</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay podera, a qualquer momento, realizar manutencoes programadas ou emergenciais, 
              implementar atualizacoes, melhorias ou correcoes, e suspender temporariamente o acesso por 
              motivos tecnicos ou de seguranca.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300 text-sm">
                Nao ha garantia de disponibilidade continua, ininterrupta ou livre de erros.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Seguranca da Informacao</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay adota medidas tecnicas e organizacionais compativeis com boas praticas de mercado 
              para protecao dos dados. Entretanto, o usuario reconhece que:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Nenhum sistema e totalmente imune a falhas ou ataques</li>
              <li>E sua responsabilidade adotar boas praticas de seguranca</li>
              <li>O uso inadequado das credenciais pode comprometer a seguranca das informacoes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Suspensao e Encerramento</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              O FluxoPay podera, a seu exclusivo criterio, suspender, restringir ou encerrar o acesso do 
              usuario, a qualquer momento e sem aviso previo, em caso de:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Violacao destes Termos de Uso</li>
              <li>Uso indevido da plataforma</li>
              <li>Suspeita de fraude ou atividade irregular</li>
              <li>Risco a seguranca do sistema ou de outros usuarios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Alteracoes dos Termos</h2>
            <p className="text-gray-400 leading-relaxed">
              O FluxoPay podera alterar estes Termos de Uso a qualquer momento. Em caso de atualizacao, 
              a nova versao sera disponibilizada na plataforma e podera ser exigido novo aceite do usuario. 
              A continuidade do uso podera ser condicionada a aceitacao dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Protecao de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              O tratamento de dados pessoais sera realizado em conformidade com a legislacao aplicavel, 
              especialmente a Lei Geral de Protecao de Dados (LGPD - Lei n 13.709/2018), conforme descrito 
              na Politica de Privacidade do FluxoPay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Foro e Legislacao Aplicavel</h2>
            <p className="text-gray-400 leading-relaxed">
              Estes Termos serao regidos pelas leis da Republica Federativa do Brasil. Fica eleito o foro 
              da comarca de Osasco/SP, com renuncia a qualquer outro, por mais privilegiado que seja, para 
              dirimir quaisquer controversias oriundas destes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Contato</h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Para duvidas ou esclarecimentos sobre estes Termos de Uso:
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
