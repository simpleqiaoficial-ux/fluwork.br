"use client"

import { useValoresVisibility } from "@/contexts/valores-visibility-context"
import { cn } from "@/lib/utils"

interface CurrencyDisplayProps {
  value: number
  className?: string
  showPrefix?: boolean
  negative?: boolean
}

export function CurrencyDisplay({ value, className, showPrefix = true, negative = false }: CurrencyDisplayProps) {
  const { valoresVisiveis } = useValoresVisibility()

  if (!valoresVisiveis) {
    return (
      <span className={cn("select-none", className)}>
        {negative ? "- " : ""}R$ ••••••
      </span>
    )
  }

  const formatted = new Intl.NumberFormat("pt-BR", {
    style: showPrefix ? "currency" : "decimal",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value))

  return (
    <span className={className}>
      {negative ? "- " : ""}{formatted}
    </span>
  )
}

export function useMaskedCurrency() {
  const { valoresVisiveis } = useValoresVisibility()

  const formatValue = (value: number, negative = false): string => {
    if (!valoresVisiveis) {
      return `${negative ? "- " : ""}R$ ••••••`
    }

    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value))

    return `${negative ? "- " : ""}${formatted}`
  }

  return { formatValue, valoresVisiveis }
}
