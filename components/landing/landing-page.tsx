import { LandingHeader } from "@/components/landing/sections/landing-header"
import { LandingHero } from "@/components/landing/sections/landing-hero"
import { LandingBenefits } from "@/components/landing/sections/landing-benefits"
import { LandingModules } from "@/components/landing/sections/landing-modules"
import { LandingHowItWorks } from "@/components/landing/sections/landing-how-it-works"
import { LandingDashboardShowcase } from "@/components/landing/sections/landing-dashboard-showcase"
import { LandingSecurity } from "@/components/landing/sections/landing-security"
import { LandingPricing } from "@/components/landing/sections/landing-pricing"
import { LandingFaq } from "@/components/landing/sections/landing-faq"
import { LandingCta } from "@/components/landing/sections/landing-cta"
import { LandingFooter } from "@/components/landing/sections/landing-footer"

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FluWork",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "FluWork é o ecossistema empresarial que conecta, organiza e impulsiona a operação da sua empresa: financeiro, prestadores de serviço, EHS, medicina ocupacional, documentos e muito mais em uma única plataforma.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "BRL",
    lowPrice: "0",
    offerCount: "3",
  },
  brand: {
    "@type": "Organization",
    name: "FluWork",
  },
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Link de pular navegação — acessibilidade via teclado */}
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo principal
      </a>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_SCHEMA) }}
      />

      <LandingHeader />

      <main id="conteudo-principal">
        <LandingHero />
        <LandingBenefits />
        <LandingModules />
        <LandingHowItWorks />
        <LandingDashboardShowcase />
        <LandingSecurity />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  )
}
