import { SectionHeading } from "@/components/landing/ui/section-heading"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { BENEFITS } from "@/lib/landing/data"

export function LandingBenefits() {
  return (
    <section id="beneficios" className="py-20 sm:py-28" aria-labelledby="beneficios-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Por que o FluWork"
          title="Organização empresarial real, não só mais um sistema"
          description="Construído para reduzir a distância entre a operação do dia a dia e a visão estratégica da sua empresa."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <FadeIn key={benefit.title} delay={index * 0.06}>
              <div className="group h-full rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <benefit.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
