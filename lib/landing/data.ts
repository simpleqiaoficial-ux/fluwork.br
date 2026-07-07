import {
  Layers,
  Zap,
  ShieldCheck,
  TrendingUp,
  Lock,
  Rocket,
  Wallet,
  Users,
  HardHat,
  Stethoscope,
  FolderKanban,
  LayoutDashboard,
  UserCog,
  Settings,
  UserPlus,
  CreditCard,
  Building2,
  LayoutGrid,
  KeyRound,
  Fingerprint,
  Database,
  Activity,
  FileLock2,
  RefreshCcw,
} from "lucide-react"
import type {
  BenefitItem,
  ModuleItem,
  HowItWorksStep,
  SecurityItem,
  PricingPlan,
  FaqItem,
  NavLink,
} from "@/types/landing"

export const NAV_LINKS: NavLink[] = [
  { label: "Recursos", href: "#beneficios" },
  { label: "Módulos", href: "#modulos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
  { label: "Contato", href: "#contato" },
]

export const BENEFITS: BenefitItem[] = [
  {
    icon: Layers,
    title: "Centralize sua operação",
    description: "Reúna financeiro, prestadores, documentos e muito mais em um único ecossistema, sem planilhas soltas ou sistemas desconectados.",
  },
  {
    icon: Zap,
    title: "Automatize processos",
    description: "Fluxos de aprovação, contratos e rotinas administrativas rodando sozinhos, liberando o time para decisões que importam.",
  },
  {
    icon: ShieldCheck,
    title: "Mais controle",
    description: "Visibilidade completa sobre cada módulo da sua empresa, com permissões claras e trilha de auditoria de ponta a ponta.",
  },
  {
    icon: TrendingUp,
    title: "Mais produtividade",
    description: "Menos retrabalho, menos e-mails perdidos, menos tempo procurando informação — mais tempo executando.",
  },
  {
    icon: Lock,
    title: "Mais segurança",
    description: "Controle de acesso por papel, criptografia e boas práticas de proteção de dados em cada camada da plataforma.",
  },
  {
    icon: Rocket,
    title: "Escalável",
    description: "Comece com o essencial e ative novos módulos conforme sua empresa cresce, sem trocar de sistema.",
  },
]

export const MODULES: ModuleItem[] = [
  {
    icon: Wallet,
    title: "Financeiro",
    description: "Pedidos de pagamento, aprovações e todo o fluxo financeiro da operação em um só lugar.",
    href: "#modulos",
  },
  {
    icon: Users,
    title: "Prestadores de Serviço",
    description: "Cadastro, contratos eletrônicos, vigência e histórico completo de cada prestador PJ da sua rede.",
    href: "#modulos",
  },
  {
    icon: HardHat,
    title: "EHS",
    description: "Saúde, segurança e meio ambiente organizados com indicadores e controle de conformidade.",
    href: "#modulos",
    badge: "Em breve",
  },
  {
    icon: Stethoscope,
    title: "Medicina Ocupacional (ASO)",
    description: "Atestados de saúde ocupacional, exames e vencimentos monitorados automaticamente.",
    href: "#modulos",
    badge: "Em breve",
  },
  {
    icon: FolderKanban,
    title: "Gestão de Documentos",
    description: "Contratos, notas fiscais e arquivos corporativos centralizados, com controle de versão e acesso.",
    href: "#modulos",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Executivo",
    description: "Indicadores em tempo real da sua operação, prontos para decisão, sem precisar montar planilha.",
    href: "#modulos",
  },
  {
    icon: UserCog,
    title: "Usuários",
    description: "Papéis, equipes e hierarquia de aprovação configuráveis conforme a estrutura da sua empresa.",
    href: "#modulos",
  },
  {
    icon: Settings,
    title: "Configurações",
    description: "Personalize a plataforma para a identidade e as regras específicas do seu negócio.",
    href: "#modulos",
  },
]

export const HOW_IT_WORKS: HowItWorksStep[] = [
  { step: 1, title: "Cadastro", description: "Crie sua conta em poucos minutos, sem burocracia.", icon: UserPlus },
  { step: 2, title: "Escolha do plano", description: "Selecione o plano que faz sentido para o tamanho da sua operação.", icon: CreditCard },
  { step: 3, title: "Configuração da empresa", description: "Personalize dados, identidade visual e estrutura organizacional.", icon: Building2 },
  { step: 4, title: "Escolha dos módulos", description: "Ative apenas o que sua empresa precisa hoje — e adicione mais quando quiser.", icon: LayoutGrid },
  { step: 5, title: "Dashboard", description: "Sua operação centralizada, organizada e pronta para escalar.", icon: LayoutDashboard },
]

export const SECURITY_ITEMS: SecurityItem[] = [
  { icon: FileLock2, title: "Proteção de dados", description: "Seus dados corporativos protegidos em cada camada da plataforma." },
  { icon: KeyRound, title: "Controle de acesso", description: "Login seguro e sessões protegidas para cada usuário da plataforma." },
  { icon: Fingerprint, title: "Permissões granulares", description: "Cada papel enxerga exatamente o que precisa — nem mais, nem menos." },
  { icon: Database, title: "Backup", description: "Rotinas de backup pensadas para preservar o histórico da sua operação." },
  { icon: Activity, title: "Disponibilidade", description: "Infraestrutura em nuvem preparada para alta disponibilidade." },
  { icon: RefreshCcw, title: "Criptografia", description: "Dados sensíveis protegidos com práticas modernas de criptografia." },
]

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Start",
    description: "Para empresas começando a organizar a operação em um único lugar.",
    users: "Até 10 usuários",
    features: [
      "Módulo Financeiro",
      "Módulo de Prestadores de Serviço",
      "Dashboard executivo",
      "Suporte por e-mail",
    ],
    ctaLabel: "Quero contratar",
  },
  {
    name: "Business",
    description: "Para empresas em crescimento que precisam de mais controle e módulos.",
    users: "Até 50 usuários",
    highlighted: true,
    features: [
      "Tudo do plano Start",
      "Gestão de Documentos",
      "Hierarquia de aprovação completa",
      "Permissões avançadas por papel",
      "Suporte prioritário",
    ],
    ctaLabel: "Quero contratar",
  },
  {
    name: "Enterprise",
    description: "Para operações complexas, com múltiplas empresas e módulos avançados.",
    users: "Usuários ilimitados",
    features: [
      "Tudo do plano Business",
      "Módulos de EHS e Medicina Ocupacional",
      "Gerente de conta dedicado",
      "Integrações personalizadas",
      "SLA corporativo",
    ],
    ctaLabel: "Falar com especialista",
  },
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "O FluWork é um ERP?",
    answer:
      "Não. O FluWork é um ecossistema empresarial: uma plataforma que reúne diversos módulos de gestão em um único lugar, pensada para crescer junto com a sua empresa, e não uma ferramenta fechada e engessada.",
  },
  {
    question: "Preciso contratar todos os módulos de uma vez?",
    answer:
      "Não. Você escolhe os módulos que fazem sentido para o momento da sua empresa e pode ativar novos módulos quando precisar, sem trocar de plataforma.",
  },
  {
    question: "O FluWork serve para qualquer segmento de empresa?",
    answer:
      "Sim. A plataforma foi construída para se adaptar a operações de diferentes tamanhos e segmentos, sem depender de um nicho específico.",
  },
  {
    question: "Como funciona o controle de acesso dos usuários?",
    answer:
      "Cada usuário recebe um papel (por exemplo, administrador, financeiro ou gerente) com permissões específicas, garantindo que cada pessoa acesse apenas o que é relevante para sua função.",
  },
  {
    question: "É possível migrar de outro sistema para o FluWork?",
    answer:
      "Sim. Nosso time de especialistas acompanha o processo de configuração inicial da sua empresa para tornar a transição simples e organizada.",
  },
  {
    question: "Quais são as formas de suporte disponíveis?",
    answer:
      "Todos os planos contam com suporte especializado, com atendimento prioritário e gerente de conta dedicado disponíveis a partir do plano Business.",
  },
]
