"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logout } from "@/app/actions/auth"

export function LogoutButton() {
  return (
    <Button variant="outline" className="gap-2" onClick={() => logout()}>
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  )
}
