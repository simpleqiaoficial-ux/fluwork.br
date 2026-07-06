import { SectionHeading } from "@/components/landing/ui/section-heading"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { HOW_IT_WORKS } from "@/lib/landing/data"

export function LandingHowItWorks() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="como-funciona-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Como funciona" title="Da contratação ao dashboard em cinco passos" />

        <div className="relative mt-16">
          {/* Linha conectora — só no desktop */}
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block" aria-hidden="true" />

          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {HOW_IT_WORKS.map((step, index) => (
              <FadeIn key={step.step} delay={index * 0.08}>
                <li className="relative flex flex-col items-start lg:items-center lg:text-center">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background font-semibold text-primary">
                    {step.step}
                  </div>
                  <div className="mt-4 flex items-center gap-2 lg:flex-col lg:gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary lg:h-10 lg:w-10">
                      <step.icon className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </li>
              </FadeIn>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
