import { LayoutDashboard, BarChart3, ListChecks, PanelLeft } from "lucide-react"
import { SectionHeading } from "@/components/landing/ui/section-heading"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { DashboardMockup } from "@/components/landing/ui/dashboard-mockup"

const HIGHLIGHTS = [
  { icon: BarChart3, title: "Gráficos em tempo real", description: "Acompanhe a evolução financeira e operacional sem depender de planilha." },
  { icon: LayoutDashboard, title: "Indicadores centralizados", description: "Contratos, financeiro e prestadores em cards claros e objetivos." },
  { icon: ListChecks, title: "Atividades da operação", description: "Veja o que aconteceu na sua empresa sem precisar perguntar pra ninguém." },
  { icon: PanelLeft, title: "Navegação por módulos", description: "Menu lateral organizado por módulo, do jeito que sua empresa usa." },
]

export function LandingDashboardShowcase() {
  return (
    <section className="overflow-hidden py-20 sm:py-28" aria-labelledby="dashboard-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Dashboard executivo"
          title="Sua operação inteira, visível em um único painel"
          description="Um dashboard pensado para decisão — não apenas para exibir números."
        />

        <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <FadeIn className="order-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:order-1 lg:grid-cols-1">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-xl border border-border/70 bg-card p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </FadeIn>

          <FadeIn delay={0.1} className="order-1 lg:order-2">
            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-2xl"
                aria-hidden="true"
              />
              <DashboardMockup detailed className="w-full" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
