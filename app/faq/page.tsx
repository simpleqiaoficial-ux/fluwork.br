"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, Search, ArrowLeft, Mail, Phone, HelpCircle, Shield, CreditCard, Key } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const faqCategories = [
  {
    id: "acesso",
    title: "Acesso e Autenticacao",
    icon: Key,
    questions: [
      {
        question: "Como recebo meu acesso ao FluWork?",
        answer: "O acesso e provisionado pelo administrador da empresa contratante. Apos o cadastro, voce recebe um e-mail com credenciais temporarias e deve alterar a senha no primeiro login. Caso nao receba, verifique o spam ou contate simpleqia.oficial@gmail.com."
      },
      {
        question: "Como recupero minha senha?",
        answer: "Clique em 'Esqueci minha senha' na tela de login e informe seu e-mail cadastrado. Voce recebera um link de redefinicao valido por 30 minutos. Se nao chegar, contate simpleqia.oficial@gmail.com ou (11) 91486-0806 via WhatsApp com seu nome e empresa."
      },
      {
        question: "Por que minha conta foi bloqueada?",
        answer: "Por seguranca, a conta e bloqueada apos 5 tentativas incorretas consecutivas. O desbloqueio automatico ocorre apos 15 minutos. Para desbloqueio imediato, contate o suporte informando seu e-mail e empresa."
      },
      {
        question: "Posso usar o FluWork no celular?",
        answer: "Sim. O FluWork e responsivo e funciona em qualquer navegador moderno (Chrome, Firefox, Safari). Recomendamos ativar a trava de tela no dispositivo e evitar redes Wi-Fi publicas sem VPN."
      }
    ]
  },
  {
    id: "gestao",
    title: "Gestao de Prestadores e Pagamentos",
    icon: CreditCard,
    questions: [
      {
        question: "O que o FluWork gerencia exatamente?",
        answer: "O FluWork e uma plataforma SaaS de gestao de prestadores de servico com foco em controle de fluxo de validacao, registro de contratos, status de aprovacao e controle de pagamentos. Ciclo completo: cadastro, validacao documental, aprovacao multinivel, ordem de pagamento, quitacao e arquivamento."
      },
      {
        question: "Como funciona o fluxo de aprovacao?",
        answer: "O fluxo e configurado pelo administrador da empresa: (1) Cadastro do prestador com dados e documentos; (2) Triagem e validacao documental; (3) Aprovacao gerencial conforme hierarquia; (4) Liberacao da ordem de pagamento. Cada etapa registra responsavel, data e justificativa."
      },
      {
        question: "Os dados de pagamento ficam armazenados no FluWork?",
        answer: "O FluWork registra os dados necessarios para controle e auditoria (valores, datas, responsaveis, comprovantes). Dados bancarios sensiveis sao trafegados via canais criptografados com acesso restrito. A empresa nao acessa dados financeiros fora do escopo operacional contratado."
      },
      {
        question: "Como exportar relatorios de pagamento?",
        answer: "Acesse 'Relatorios' no menu principal, selecione filtros (periodo, prestador, status) e clique em 'Exportar'. Formatos disponiveis: PDF e CSV. Os relatorios incluem trilha de auditoria completa com todas as etapas do fluxo."
      }
    ]
  },
  {
    id: "seguranca",
    title: "Seguranca e Privacidade",
    icon: Shield,
    questions: [
      {
        question: "Como meus dados sao protegidos?",
        answer: "Toda comunicacao usa TLS 1.3. Senhas armazenadas com hash bcrypt (fator >= 12). Dados em repouso com AES-256. Logs imutaveis de todas as acoes. MFA obrigatorio para administradores. Revisoes de seguranca periodicas realizadas."
      },
      {
        question: "Como reportar uma suspeita de incidente de seguranca?",
        answer: "Notifique imediatamente via simpleqia.oficial@gmail.com ou WhatsApp (11) 91486-0806. Descreva o ocorrido, horario e funcionalidade envolvida. Nunca compartilhe sua senha com ninguem, nem com o suporte. SLA de resposta de 4 horas para incidentes criticos."
      },
      {
        question: "O sistema registra minhas acoes?",
        answer: "Sim. Por razoes de seguranca e auditoria, o FluWork registra logs de acesso, acoes realizadas, alteracoes de dados e tentativas de login. Esses registros sao acessiveis apenas pelo time de TI e gestores autorizados, conforme a Politica de Privacidade."
      }
    ]
  },
  {
    id: "suporte",
    title: "Suporte Tecnico",
    icon: HelpCircle,
    questions: [
      {
        question: "Quais sao os canais de suporte?",
        answer: "E-mail: simpleqia.oficial@gmail.com (resposta em ate 24h uteis). WhatsApp: (11) 91486-0806 (seg-sex 8h-18h). Para incidentes criticos de producao: SLA de 4 horas corridas, 7 dias por semana. Sempre informe empresa, e-mail de acesso e descricao detalhada do problema."
      },
      {
        question: "Como solicitar criacao ou remocao de usuarios?",
        answer: "O administrador da empresa pode gerenciar usuarios no painel de configuracoes. Para operacoes em lote, contate simpleqia.oficial@gmail.com com nome completo, e-mail e nivel de acesso desejado. Prazo de ate 1 dia util."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  const displayCategories = activeCategory
    ? filteredCategories.filter(c => c.id === activeCategory)
    : filteredCategories

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
            <Link href="/faq" className="text-foreground font-medium">FAQ</Link>
            <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">Termos</Link>
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Central de Ajuda</h1>
        <p className="text-sm text-muted-foreground mt-2">Encontre respostas para suas duvidas sobre o FluWork</p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto mt-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              activeCategory === null
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground border-border hover:text-foreground"
            )}
          >
            Todas
          </button>
          {faqCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border hover:text-foreground"
              )}
            >
              <category.icon className="h-3.5 w-3.5" />
              {category.title}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {displayCategories.map(category => (
          <div key={category.id} className="mb-10">
            <h2 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <category.icon className="h-4 w-4 text-muted-foreground" />
              {category.title}
            </h2>

            <div className="divide-y border-t border-b">
              {category.questions.map((item, idx) => {
                const questionId = `${category.id}-${idx}`
                const isExpanded = expandedQuestions.includes(questionId)

                return (
                  <div key={questionId}>
                    <button
                      onClick={() => toggleQuestion(questionId)}
                      className="w-full flex items-center justify-between gap-4 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-foreground">{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <p className="text-sm text-muted-foreground leading-relaxed pb-4 pr-8">
                        {item.answer}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {displayCategories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Nenhuma pergunta encontrada para "{searchTerm}"</p>
          </div>
        )}

        {/* Contact */}
        <div className="mt-16 pt-10 border-t text-center">
          <h3 className="text-lg font-semibold">Ainda precisa de ajuda?</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Nossa equipe esta pronta para ajudar voce</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <a href="mailto:simpleqia.oficial@gmail.com">
                <Mail className="h-4 w-4" />
                simpleqia.oficial@gmail.com
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://wa.me/5511914860806" target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4" />
                (11) 91486-0806
              </a>
            </Button>
          </div>
        </div>
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
