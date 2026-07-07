"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ComponentType } from "react"

interface BottomNavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

interface BottomNavigationProps {
  items: BottomNavItem[]
  onMoreClick: () => void
}

/** Navegação primária no celular — os itens mais usados do perfil + "Mais" abrindo o menu completo. */
export function BottomNavigation({ items, onMoreClick }: BottomNavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (href: string) => {
    const [itemPath, itemQuery] = href.split("?")
    if (pathname !== itemPath) return false
    if (!itemQuery) return !searchParams.get("tab")
    return searchParams.get("tab") === new URLSearchParams(itemQuery).get("tab")
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegação principal"
    >
      {items.slice(0, 4).map((item) => {
        const active = isActive(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-[64px] truncate">{item.label}</span>
          </Link>
        )
      })}
      <button
        type="button"
        onClick={onMoreClick}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
        <span>Mais</span>
      </button>
    </nav>
  )
}
