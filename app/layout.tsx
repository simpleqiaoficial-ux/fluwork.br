import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css" // Import globals.css here
import "./main.css"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { UserHeader } from "@/components/user-header"
import { getSession } from "@/lib/session"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { empresas } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AutoLogoutProvider } from "@/components/auto-logout-provider"
import { ValoresVisibilityProvider } from "@/contexts/valores-visibility-context"
import { TermsAcceptanceProvider } from "@/components/terms-acceptance-provider"
import { SystemStatusProvider } from "@/components/system-status-provider"
import { ImpersonationBanner } from "@/components/impersonation-banner"
import { EmpresaBloqueadaScreen } from "@/components/empresa-bloqueada-screen"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import cn from "classnames"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FluWork - Gestão de Prestadores",
  description: "Gerencie contratos, notas fiscais e valores contratuais de prestadores com facilidade",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/esqueci-senha" ||
    pathname.startsWith("/redefinir-senha") ||
    pathname === "/setup" ||
    pathname === "/faq" ||
    pathname === "/termos" ||
    pathname === "/privacidade"
  // "/" sem sessão é a landing page pública (marketing) — não deve ganhar sidebar/header do
  // app autenticado (ela tem seu próprio header/rodapé). Com sessão, "/" continua sendo o
  // dashboard normal, com todo o chrome de sempre.
  const isMarketingPage = pathname === "/" && !session
  const isChromeless = isAuthPage || isMarketingPage

  let empresaNome: string | undefined
  let empresaBloqueadaMotivo: string | null | undefined
  if (!isChromeless && session) {
    if (session.tipoAcesso === "SuperAdmin" && session.viewAsEmpresaId) {
      empresaNome = session.viewAsEmpresaNome || "Empresa"
    } else if (session.tipoAcesso === "SuperAdmin") {
      empresaNome = "Painel FluWork"
    } else if (session.empresaId) {
      const [empresa] = await db
        .select({ razaoSocial: empresas.razaoSocial, nomeFantasia: empresas.nomeFantasia, status: empresas.status, bloqueadoMotivo: empresas.bloqueadoMotivo })
        .from(empresas)
        .where(eq(empresas.id, session.empresaId))
      empresaNome = empresa?.nomeFantasia || empresa?.razaoSocial
      // Empresa bloqueada: nenhum usuário dela navega no sistema, independente do papel —
      // só SuperAdmin (que não pertence a empresa nenhuma) escapa desta checagem.
      if (empresa?.status === "blocked") {
        empresaBloqueadaMotivo = empresa.bloqueadoMotivo
      }
    }
  }

  const impersonando = session?.tipoAcesso === "SuperAdmin" && !!session.viewAsEmpresaId

  return (
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <body className="antialiased bg-background">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <ValoresVisibilityProvider>
          {empresaBloqueadaMotivo !== undefined ? (
            <EmpresaBloqueadaScreen motivo={empresaBloqueadaMotivo} />
          ) : (
            <>
              {!isChromeless && <SidebarNavigation tipoAcesso={session?.tipoAcesso} />}

              <div
                className={cn("min-h-screen transition-[padding] duration-150", !isChromeless && "lg:pl-[var(--sidebar-w,16rem)]")}
              >
                {impersonando && <ImpersonationBanner empresaNome={empresaNome || "Empresa"} />}
                {!isChromeless && session && (
                  <UserHeader
                    nomeCompleto={session.nomeCompleto}
                    email={session.email}
                    cnpj={session.cnpj}
                    salario={session.salario}
                    empresaNome={empresaNome}
                    tipoAcesso={session.tipoAcesso}
                    fotoUrl={session.fotoUrl}
                  />
                )}
                <main className={cn("transition-all duration-300", !isChromeless && session && "pt-14 lg:pt-0 pb-16 lg:pb-0")}>
                  {!isChromeless && session ? (
                    <SystemStatusProvider tipoAcesso={session.tipoAcesso}>
                      <AutoLogoutProvider>
                        <TermsAcceptanceProvider
                          isAuthenticated={!!session}
                          userName={session.nomeCompleto}
                          userId={session.colaboradorId}
                        >
                          {children}
                        </TermsAcceptanceProvider>
                      </AutoLogoutProvider>
                    </SystemStatusProvider>
                  ) : children}
                </main>
              </div>
            </>
          )}
        </ValoresVisibilityProvider>
        <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
