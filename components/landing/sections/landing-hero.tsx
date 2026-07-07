"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, CalendarClock, Wallet, HardHat, Stethoscope, Users, FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardMockup } from "@/components/landing/ui/dashboard-mockup"
import { FloatingBadge } from "@/components/landing/ui/floating-badge"
import { ContactDialog } from "@/components/landing/contact-dialog"

export function LandingHero() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28" aria-labelledby="hero-heading">
      {/* Fundo: gradiente sutil + grid discreto, sem exagero de cor */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-[-10%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.15]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
        {/* Coluna de texto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Ecossistema empresarial
          </span>

          <h1 id="hero-heading" className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Tudo o que sua empresa precisa em um único lugar.
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            Uma plataforma completa para conectar, organizar e impulsionar sua empresa — financeiro, prestadores de
            serviço, documentos e muito mais, reunidos em um único ecossistema.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2 shadow-md" onClick={() => setContactOpen(true)}>
              Quero contratar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
              <a href="#contato">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Agendar demonstração
              </a>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Implantação guiada por especialistas
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Módulos ativados sob demanda
            </span>
          </div>
        </motion.div>

        {/* Coluna visual: mockup do dashboard + módulos flutuantes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="relative mx-auto w-full max-w-lg lg:max-w-none"
        >
          <div className="relative">
            <DashboardMockup className="w-full" />

            <FloatingBadge icon={Wallet} label="Financeiro" className="-left-6 -top-6 hidden sm:flex" delay={0.4} duration={4.5} />
            <FloatingBadge icon={Users} label="Prestadores" className="-right-4 top-8 hidden sm:flex" delay={0.7} duration={5} />
            <FloatingBadge icon={HardHat} label="EHS" className="-left-8 bottom-16 hidden lg:flex" delay={1} duration={4.2} />
            <FloatingBadge icon={Stethoscope} label="ASO" className="-right-6 bottom-6 hidden sm:flex" delay={1.3} duration={4.8} />
            <FloatingBadge icon={FolderKanban} label="Documentos" className="left-1/3 -bottom-8 hidden lg:flex" delay={1.6} duration={4.6} />
          </div>
        </motion.div>
      </div>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </section>
  )
}
