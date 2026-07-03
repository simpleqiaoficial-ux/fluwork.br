"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { TermsAcceptanceModal } from "./terms-acceptance-modal"
import { checkTermsAcceptance } from "@/app/actions/terms"

interface TermsAcceptanceContextType {
  hasAcceptedTerms: boolean
  isLoading: boolean
  checkAcceptance: () => Promise<void>
}

const TermsAcceptanceContext = createContext<TermsAcceptanceContextType>({
  hasAcceptedTerms: true,
  isLoading: true,
  checkAcceptance: async () => {},
})

export function useTermsAcceptance() {
  return useContext(TermsAcceptanceContext)
}

interface TermsAcceptanceProviderProps {
  children: ReactNode
  userName?: string
  userId?: string
  isAuthenticated?: boolean
}

export function TermsAcceptanceProvider({ 
  children, 
  userName,
  userId,
  isAuthenticated = false 
}: TermsAcceptanceProviderProps) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const checkAcceptance = async () => {
    if (!isAuthenticated || !userId) {
      setIsLoading(false)
      return
    }

    try {
      const result = await checkTermsAcceptance(userId)
      setHasAcceptedTerms(result.accepted)
      setShowModal(!result.accepted)
    } catch (error) {
      console.error("[v0] Error checking terms acceptance:", error)
      // Em caso de erro, assume que aceitou para não bloquear o usuário
      setHasAcceptedTerms(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAcceptance()
  }, [isAuthenticated, userId])

  const handleAccept = () => {
    setHasAcceptedTerms(true)
    setShowModal(false)
  }

  return (
    <TermsAcceptanceContext.Provider value={{ hasAcceptedTerms, isLoading, checkAcceptance }}>
      {children}
      {isAuthenticated && userId && (
        <TermsAcceptanceModal
          isOpen={showModal}
          onAccept={handleAccept}
          userName={userName}
          userId={userId}
        />
      )}
    </TermsAcceptanceContext.Provider>
  )
}
