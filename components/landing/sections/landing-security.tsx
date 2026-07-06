import { ShieldCheck } from "lucide-react"
import { SectionHeading } from "@/components/landing/ui/section-heading"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { SECURITY_ITEMS } from "@/lib/landing/data"

export function LandingSecurity() {
  return (
    <section className="relative overflow-hidden bg-foreground py-20 text-background sm:py-28" aria-labelledby="seguranca-heading">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-background">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Segurança e confiança
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Construído com padrões de segurança de plataforma corporativa
          </h2>
          <p className="mt-4 text-balance text-base leading-relaxed text-background/70 sm:text-lg">
            Sua operação envolve dados sensíveis. O FluWork foi projetado para proteger cada camada dessa informação.
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_ITEMS.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.06}>
              <div className="h-full rounded-2xl border border-background/10 bg-background/5 p-6 backdrop-blur-sm transition-colors duration-300 hover:bg-background/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-background/10 text-background">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-background/70">{item.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
