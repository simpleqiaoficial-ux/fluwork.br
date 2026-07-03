"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface ValoresVisibilityContextType {
  valoresVisiveis: boolean
  toggleValoresVisiveis: () => void
  mascararValor: (valor: string | number) => string
}

const ValoresVisibilityContext = createContext<ValoresVisibilityContextType | undefined>(undefined)

export function ValoresVisibilityProvider({ children }: { children: ReactNode }) {
  const [valoresVisiveis, setValoresVisiveis] = useState(true)

  const toggleValoresVisiveis = useCallback(() => {
    setValoresVisiveis((prev) => !prev)
  }, [])

  const mascararValor = useCallback(
    (valor: string | number): string => {
      if (valoresVisiveis) {
        return typeof valor === "number"
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
          : valor
      }
      return "R$ ••••••"
    },
    [valoresVisiveis]
  )

  return (
    <ValoresVisibilityContext.Provider value={{ valoresVisiveis, toggleValoresVisiveis, mascararValor }}>
      {children}
    </ValoresVisibilityContext.Provider>
  )
}

export function useValoresVisibility() {
  const context = useContext(ValoresVisibilityContext)
  if (context === undefined) {
    throw new Error("useValoresVisibility deve ser usado dentro de ValoresVisibilityProvider")
  }
  return context
}
