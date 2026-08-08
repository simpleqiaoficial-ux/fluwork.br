import Link from "next/link"
import { Mail, MapPin } from "lucide-react"
import { Logo } from "@/components/brand/logo"
import { NAV_LINKS } from "@/lib/landing/data"

const LEGAL_LINKS = [
  { label: "Termos de uso", href: "/termos" },
  { label: "Política de privacidade", href: "/privacidade" },
]

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-sidebar">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Logo size={36} dark />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sidebar-muted">
              O ecossistema empresarial que conecta, organiza e impulsiona a operação da sua empresa.
            </p>
          </div>

          <nav aria-label="Links da plataforma">
            <h3 className="text-sm font-semibold text-sidebar-foreground">Plataforma</h3>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-sidebar-muted transition-colors hover:text-sidebar-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Links legais">
            <h3 className="text-sm font-semibold text-sidebar-foreground">Legal</h3>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sidebar-muted transition-colors hover:text-sidebar-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold text-sidebar-foreground">Contato</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="mailto:contato@fluxteme.com.br" className="flex items-center gap-2 text-sm text-sidebar-muted transition-colors hover:text-sidebar-foreground">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  contato@fluxteme.com.br
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-sidebar-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Atendimento em todo o Brasil
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-sidebar-border pt-8 sm:flex-row">
          <p className="text-xs text-sidebar-muted">© {year} Fluxteme. Todos os direitos reservados.</p>
          <p className="text-xs text-sidebar-muted">Feito para empresas que querem crescer com organização.</p>
        </div>
      </div>
    </footer>
  )
}
