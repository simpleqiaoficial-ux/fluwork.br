import Link from "next/link"
import { ArrowLeft, Mail, Phone, AlertTriangle } from "lucide-react"

export default function TermosPage() {
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
            <Link href="/termos" className="text-foreground font-medium">Termos</Link>
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center border-b">
        <h1 className="text-2xl font-semibold tracking-tight">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mt-2">FluWork - Plataforma de Gestao de Prestadores de Servico</p>
        <p className="text-xs text-muted-foreground mt-3">Ultima atualizacao: 02/04/2026 · Versao 2.1</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-4">
          "Declaro que li, compreendi e concordo com os Termos de Uso e a Politica de Privacidade do FluWork."
        </p>

        <section>
          <h2 className="text-base font-semibold mb-3">1. Identificacao</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O FluWork e uma plataforma digital operada por FELIPE NOGUEIRA SILVA SERVICOS COMERCIO E LOCACAO,
            inscrita no CNPJ sob o n 26.344.386/0001-42, com nome fantasia KAFERRI TEC SERVICOS, com sede em
            Osasco/SP, responsavel pelo desenvolvimento, manutencao e gestao da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">2. Aceite dos Termos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Ao acessar, utilizar ou se cadastrar na plataforma FluWork, o usuario declara que leu, compreendeu
            e concorda integralmente com estes Termos de Uso e com a Politica de Privacidade aplicavel. O aceite
            e condicao indispensavel para utilizacao do sistema.
          </p>
          <div className="flex items-start gap-3 border-l-2 border-destructive pl-4 py-1">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Caso o usuario nao concorde, total ou parcialmente, com quaisquer disposicoes aqui previstas,
              devera abster-se imediatamente de utilizar a plataforma.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">3. Objeto da Plataforma</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O FluWork consiste em uma plataforma digital voltada a gestao e organizacao de processos financeiros
            corporativos, permitindo, entre outras funcionalidades:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Criacao, controle e acompanhamento de solicitacoes de pagamento</li>
            <li>Definicao e gestao de fluxos de aprovacao internos</li>
            <li>Anexacao, armazenamento e validacao de documentos</li>
            <li>Controle de prazos, status e responsaveis</li>
            <li>Registro e rastreabilidade de operacoes</li>
          </ul>
          <div className="border-l-2 border-border pl-4 py-1">
            <p className="text-sm text-muted-foreground">
              O FluWork nao realiza movimentacoes financeiras, nao sendo instituicao financeira, banco,
              intermediadora de pagamentos ou responsavel por execucoes de transferencias, limitando-se a
              gestao e organizacao de informacoes.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">4. Cadastro e Acesso</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O acesso a plataforma e restrito a usuarios devidamente autorizados pela empresa contratante.
            A gestao de usuarios, permissoes e acessos e de inteira responsabilidade da empresa contratante.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">O usuario compromete-se a:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Fornecer informacoes verdadeiras, completas e atualizadas</li>
            <li>Manter a confidencialidade de suas credenciais de acesso</li>
            <li>Nao compartilhar login e senha com terceiros</li>
            <li>Utilizar a plataforma exclusivamente para fins legitimos e autorizados</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Toda atividade realizada na conta sera considerada de responsabilidade do usuario e/ou da empresa vinculada.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">5. Responsabilidades do Usuario</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O usuario declara estar ciente de que e exclusivamente responsavel por:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Todas as informacoes, dados e documentos inseridos na plataforma</li>
            <li>A veracidade, integridade e legalidade dos dados fornecidos</li>
            <li>As decisoes tomadas com base nas informacoes registradas</li>
            <li>O cumprimento de politicas internas, normas corporativas e legislacoes aplicaveis</li>
          </ul>
          <div className="flex items-start gap-3 border-l-2 border-destructive pl-4 py-1">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              E expressamente proibido: utilizar a plataforma para fins ilicitos, fraudulentos ou nao autorizados;
              inserir informacoes falsas ou enganosas; tentar acessar areas restritas sem permissao; comprometer
              a seguranca, estabilidade ou funcionamento do sistema.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">6. Limitacao de Responsabilidade</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Na maxima extensao permitida pela legislacao aplicavel, o FluWork nao se responsabiliza por:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Erros, inconsistencias ou omissoes nas informacoes inseridas pelos usuarios</li>
            <li>Decisoes financeiras, operacionais ou estrategicas tomadas com base na plataforma</li>
            <li>Prejuizos decorrentes de uso indevido ou acesso nao autorizado</li>
            <li>Falhas decorrentes de credenciais comprometidas</li>
            <li>Indisponibilidade temporaria do sistema</li>
            <li>Falhas provenientes de terceiros, integracoes externas ou infraestrutura fora de seu controle</li>
          </ul>
          <div className="flex items-start gap-3 border-l-2 border-warning pl-4 py-1">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              A utilizacao da plataforma e realizada por conta e risco do usuario e da empresa contratante.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">7. Disponibilidade do Sistema</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O FluWork podera, a qualquer momento, realizar manutencoes programadas ou emergenciais,
            implementar atualizacoes, melhorias ou correcoes, e suspender temporariamente o acesso por
            motivos tecnicos ou de seguranca.
          </p>
          <div className="flex items-start gap-3 border-l-2 border-warning pl-4 py-1">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Nao ha garantia de disponibilidade continua, ininterrupta ou livre de erros.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">8. Seguranca da Informacao</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O FluWork adota medidas tecnicas e organizacionais compativeis com boas praticas de mercado
            para protecao dos dados. Entretanto, o usuario reconhece que:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4">
            <li>Nenhum sistema e totalmente imune a falhas ou ataques</li>
            <li>E sua responsabilidade adotar boas praticas de seguranca</li>
            <li>O uso inadequado das credenciais pode comprometer a seguranca das informacoes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">9. Suspensao e Encerramento</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            O FluWork podera, a seu exclusivo criterio, suspender, restringir ou encerrar o acesso do
            usuario, a qualquer momento e sem aviso previo, em caso de:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-4">
            <li>Violacao destes Termos de Uso</li>
            <li>Uso indevido da plataforma</li>
            <li>Suspeita de fraude ou atividade irregular</li>
            <li>Risco a seguranca do sistema ou de outros usuarios</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">10. Alteracoes dos Termos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O FluWork podera alterar estes Termos de Uso a qualquer momento. Em caso de atualizacao,
            a nova versao sera disponibilizada na plataforma e podera ser exigido novo aceite do usuario.
            A continuidade do uso podera ser condicionada a aceitacao dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">11. Protecao de Dados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O tratamento de dados pessoais sera realizado em conformidade com a legislacao aplicavel,
            especialmente a Lei Geral de Protecao de Dados (LGPD - Lei n 13.709/2018), conforme descrito
            na Politica de Privacidade do FluWork.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">12. Foro e Legislacao Aplicavel</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Estes Termos serao regidos pelas leis da Republica Federativa do Brasil. Fica eleito o foro
            da comarca de Osasco/SP, com renuncia a qualquer outro, por mais privilegiado que seja, para
            dirimir quaisquer controversias oriundas destes Termos.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">13. Contato</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Para duvidas ou esclarecimentos sobre estes Termos de Uso:
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
