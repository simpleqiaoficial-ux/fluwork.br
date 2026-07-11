"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { getNavForRole } from "@/lib/nav-config"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoAcesso?: string
  impersonando?: boolean
}

/** Busca global (Cmd+K) — indexa a mesma configuração de navegação usada na sidebar, agrupada
 *  por workspace. Reutiliza o filtro fuzzy nativo do cmdk (value + keywords). */
export function CommandPalette({ open, onOpenChange, tipoAcesso, impersonando }: CommandPaletteProps) {
  const router = useRouter()
  const { workspaces } = useMemo(() => getNavForRole(tipoAcesso, impersonando), [tipoAcesso, impersonando])

  const goTo = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas, prestadores, ordens..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        {workspaces.map((ws) =>
          ws.label ? (
            <CommandGroup key={ws.id} heading={ws.label}>
              {ws.groups.flatMap((g) => g.items).map((item) => (
                <CommandItem
                  key={item.href}
                  value={[item.label, ...(item.keywords || [])].join(" ")}
                  onSelect={() => goTo(item.href)}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandGroup key={ws.id}>
              {ws.groups.flatMap((g) => g.items).map((item) => (
                <CommandItem
                  key={item.href}
                  value={[item.label, ...(item.keywords || [])].join(" ")}
                  onSelect={() => goTo(item.href)}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ),
        )}
      </CommandList>
    </CommandDialog>
  )
}
