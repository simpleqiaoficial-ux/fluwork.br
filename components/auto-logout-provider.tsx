"use client"

import type React from "react"

import { useAutoLogout } from "@/hooks/use-auto-logout"

export function AutoLogoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useAutoLogout()

  return <>{children}</>
}
