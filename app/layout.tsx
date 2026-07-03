import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css" // Import globals.css here
import "./main.css"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { UserHeader } from "@/components/user-header"
import { getSession } from "@/lib/session"
import { headers } from "next/headers"
import { AutoLogoutProvider } from "@/components/auto-logout-provider"
import { ValoresVisibilityProvider } from "@/contexts/valores-visibility-context"
import { TermsAcceptanceProvider } from "@/components/terms-acceptance-provider"
import { SystemStatusProvider } from "@/components/system-status-provider"
import cn from "classnames"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

  const isAuthPage = pathname === "/login" || pathname === "/setup" || pathname === "/faq" || pathname === "/termos" || pathname === "/privacidade"

  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-background">
        <ValoresVisibilityProvider>
          {!isAuthPage && <SidebarNavigation tipoAcesso={session?.tipoAcesso} />}

          <div
            className={cn("min-h-screen transition-[padding] duration-150", !isAuthPage && "lg:pl-[var(--sidebar-w,16rem)]")}
          >
            {!isAuthPage && session && (
              <UserHeader
                nomeCompleto={session.nomeCompleto}
                email={session.email}
                cnpj={session.cnpj}
                salario={session.salario}
              />
            )}
            <main className={cn("transition-all duration-300", !isAuthPage && session && "pt-14 lg:pt-0", !isAuthPage && !session && "pt-14 lg:pt-0")}>
              {!isAuthPage && session ? (
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
        </ValoresVisibilityProvider>
      </body>
    </html>
  )
}
