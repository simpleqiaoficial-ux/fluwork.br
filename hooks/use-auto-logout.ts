"use client"

import { useEffect, useRef } from "react"
import { logout } from "@/app/actions/auth"

const INACTIVITY_TIMEOUT = 240000 // 4 minutos em milissegundos

export function useAutoLogout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetTimer = () => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(() => {
      logout()
    }, INACTIVITY_TIMEOUT)
  }

  useEffect(() => {
    // Eventos que indicam atividade do usuário
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

    // Iniciar timer
    resetTimer()

    // Adicionar listeners para todos os eventos
    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Cleanup: remover listeners e limpar timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [])
}
