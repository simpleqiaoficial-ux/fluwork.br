"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface MobileNavContextValue {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

// SidebarNavigation (o menu lateral deslizante) e UserHeader (onde mora o botão de abrir
// esse menu no celular) são componentes irmãos em app/layout.tsx, não pai/filho — esse
// contexto é o jeito de os dois compartilharem o mesmo estado de "aberto/fechado" sem
// prop-drilling através do layout.
const MobileNavContext = createContext<MobileNavContextValue | null>(null)

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return <MobileNavContext.Provider value={{ mobileOpen, setMobileOpen }}>{children}</MobileNavContext.Provider>
}

export function useMobileNav() {
  const context = useContext(MobileNavContext)
  if (!context) throw new Error("useMobileNav precisa estar dentro de um MobileNavProvider")
  return context
}
