import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionHeading } from "@/components/landing/ui/section-heading"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { PRICING_PLANS } from "@/lib/landing/data"
import { cn } from "@/lib/utils"

export function LandingPricing() {
  return (
    <section id="planos" className="bg-muted/30 py-20 sm:py-28" aria-labelledby="planos-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Planos"
          title="Um plano para cada estágio da sua empresa"
          description="Comece pelo essencial e evolua conforme sua operação cresce — sem trocar de plataforma."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {PRICING_PLANS.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.08}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-2xl border p-8 transition-all duration-300",
                  plan.highlighted
                    ? "relative border-primary bg-card shadow-xl shadow-primary/10 lg:-translate-y-3"
                    : "border-border/70 bg-card hover:-translate-y-1 hover:shadow-lg",
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" aria-label="Plano mais popular">
                    Mais popular
                  </Badge>
                )}

                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                <p className="mt-5 text-sm font-medium text-primary">{plan.users}</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="mt-8" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href={plan.name === "Enterprise" ? "#contato" : "/register"}>{plan.ctaLabel}</Link>
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Precisa de algo sob medida? <a href="#contato" className="font-medium text-primary hover:underline">Fale com nosso time</a> para montar um plano específico para sua operação.
        </p>
      </div>
    </section>
  )
}
