"use client"

import { Fragment, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Eye, EyeOff, Menu } from "lucide-react"
import { useValoresVisibility } from "@/contexts/valores-visibility-context"
import { useMobileNav } from "@/contexts/mobile-nav-context"
import { Button } from "@/components/ui/button"
import { getBreadcrumbForPath } from "@/lib/nav-config"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"

interface UserHeaderProps {
  nomeCompleto: string
  email: string
  cnpj?: string
  salario?: number
  empresaNome?: string
  tipoAcesso?: string
  fotoUrl?: string
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return (partes[0]?.[0] || "").concat(partes.length > 1 ? partes[partes.length - 1][0] : "").toUpperCase()
}

export function UserHeader({ nomeCompleto, email, cnpj, salario, empresaNome, tipoAcesso, fotoUrl }: UserHeaderProps) {
  const { valoresVisiveis, toggleValoresVisiveis, mascararValor } = useValoresVisibility()
  const { setMobileOpen } = useMobileNav()
  const pathname = usePathname()
  const crumbs = useMemo(() => getBreadcrumbForPath(pathname, tipoAcesso), [pathname, tipoAcesso])

  return (
    <header className="sticky top-0 z-30 border-b bg-card">
      {empresaNome && (
        <div className="px-4 lg:px-6 py-1 border-b bg-muted/40">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {empresaNome}
          </span>
        </div>
      )}
      <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 -ml-1.5 shrink-0 lg:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 overflow-hidden">
          {crumbs.length > 0 ? (
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap text-[13px]">
                {crumbs.map((seg, i) => (
                  <Fragment key={seg.label + i}>
                    {i > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {i === crumbs.length - 1 ? (
                        <BreadcrumbPage className="text-[13px] font-medium truncate">{seg.label}</BreadcrumbPage>
                      ) : (
                        <span className="truncate text-muted-foreground">{seg.label}</span>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <span className="text-[13px] font-medium text-foreground truncate">{nomeCompleto}</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {salario !== undefined && salario !== null && (
            <span className="hidden sm:inline text-sm font-medium text-foreground tabular-nums">
              {mascararValor(salario)}
            </span>
          )}
          {cnpj && (
            <span className="hidden md:inline text-xs text-muted-foreground font-mono">{cnpj}</span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleValoresVisiveis}
            className="h-8 w-8"
            title={valoresVisiveis ? "Ocultar valores" : "Mostrar valores"}
          >
            {valoresVisiveis ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-foreground" />
            )}
          </Button>

          <NotificationBell />
          <ThemeToggle />

          <Link
            href="/perfil"
            title={`${nomeCompleto} · ${email}`}
            className="shrink-0 rounded-md ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                {iniciais(nomeCompleto)}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
