"use client"

import { useState } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/landing/ui/fade-in"
import { ContactDialog } from "@/components/landing/contact-dialog"

export function LandingCta() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <section id="contato" className="py-20 sm:py-28" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-14 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.1]" aria-hidden="true" />

            <h2 id="cta-heading" className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Pronto para centralizar a operação da sua empresa?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              Fale com nosso time ou comece agora mesmo — a implantação é guiada do início ao fim.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 shadow-md" onClick={() => setContactOpen(true)}>
                Quero contratar
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-background" asChild>
                <a href="mailto:simpleqia.oficial@gmail.com">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  simpleqia.oficial@gmail.com
                </a>
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </section>
  )
}
