"use client"

import { useState, useEffect, ReactNode, createContext, useContext } from "react"
import { getSystemStatus } from "@/app/actions/system-status"
import { SystemSuspendedScreen } from "./system-suspended-screen"

interface SystemStatusContextType {
  isSystemSuspended: boolean
  suspensionReason: string | null
  canBypassSuspension: boolean
}

const SystemStatusContext = createContext<SystemStatusContextType>({
  isSystemSuspended: false,
  suspensionReason: null,
  canBypassSuspension: false
})

export function useSystemStatus() {
  return useContext(SystemStatusContext)
}

interface SystemStatusProviderProps {
  children: ReactNode
  tipoAcesso?: string
}

export function SystemStatusProvider({ children, tipoAcesso }: SystemStatusProviderProps) {
  const [isActive, setIsActive] = useState(true)
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const tipoAcessoLower = tipoAcesso?.toLowerCase() || ""
  const isAdm = tipoAcessoLower === "adm"

  // Apenas o Adm pode acessar com o sistema suspenso
  const canBypassSuspension = isAdm

  useEffect(() => {
    const checkStatus = async () => {
      const result = await getSystemStatus()
      if (result.success && result.data) {
        setIsActive(result.data.is_active)
        // O campo no banco é suspended_reason
        setSuspensionReason(result.data.suspended_reason)
      }
      setIsLoading(false)
    }

    checkStatus()

    // Verifica a cada 30 segundos
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Enquanto carrega, mostra o conteudo normal
  if (isLoading) {
    return <>{children}</>
  }

  // Adm sempre pode acessar normalmente, independente do status do sistema
  if (isAdm) {
    return (
      <SystemStatusContext.Provider value={{ 
        isSystemSuspended: !isActive, 
        suspensionReason, 
        canBypassSuspension: true 
      }}>
        {children}
      </SystemStatusContext.Provider>
    )
  }

  // Todos os outros usuarios (financeiro, colaborador, supervisor, etc.)
  // veem a tela de bloqueio quando o sistema esta suspenso
  if (!isActive) {
    return <SystemSuspendedScreen reason={suspensionReason} />
  }

  return (
    <SystemStatusContext.Provider value={{ 
      isSystemSuspended: false, 
      suspensionReason: null, 
      canBypassSuspension: false 
    }}>
      {children}
    </SystemStatusContext.Provider>
  )
}
