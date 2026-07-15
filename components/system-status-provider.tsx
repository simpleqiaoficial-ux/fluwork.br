"use client"

import { useState, useEffect, ReactNode, createContext, useContext } from "react"
import { usePathname } from "next/navigation"
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

  const pathname = usePathname()
  const tipoAcessoLower = tipoAcesso?.toLowerCase() || ""
  const isAdm = tipoAcessoLower === "adm"
  // Central de Suporte precisa continuar acessível com o sistema suspenso — é exatamente
  // quando mais se precisa de suporte — pra qualquer papel, não só Adm.
  const emRotaSuporte = pathname.startsWith("/suporte")

  // Apenas o Adm (ou quem está na Central de Suporte) pode acessar com o sistema suspenso
  const canBypassSuspension = isAdm || emRotaSuporte

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

  // Adm (ou quem está na Central de Suporte) sempre pode acessar normalmente, independente
  // do status do sistema.
  if (canBypassSuspension) {
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
