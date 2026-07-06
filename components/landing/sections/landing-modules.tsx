import { ArrowRight } from "lucide-react"
import { SectionHeading } from "@/components/landing/ui/section-heading"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { MODULES } from "@/lib/landing/data"

export function LandingModules() {
  return (
    <section id="modulos" className="bg-muted/30 py-20 sm:py-28" aria-labelledby="modulos-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Módulos"
          title="Um ecossistema de módulos, não um sistema fechado"
          description="Ative os módulos que sua operação precisa hoje. A arquitetura do FluWork já está pronta para os próximos."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module, index) => (
            <FadeIn key={module.title} delay={index * 0.05}>
              <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <module.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {module.badge && (
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {module.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{module.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                <a
                  href={module.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Saiba mais
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
