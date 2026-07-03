"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface CountdownTimerProps {
  dataLimite: string
}

export function CountdownTimer({ dataLimite }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const deadline = new Date(dataLimite).getTime()
      const difference = deadline - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, expired: false })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [dataLimite]) // Removido onExpired das dependências

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 border-l-2 border-destructive pl-3 py-1.5">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">Prazo expirado</p>
          <p className="text-xs text-muted-foreground">O prazo para anexar a nota fiscal terminou</p>
        </div>
      </div>
    )
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6

  return (
    <div className={`flex items-center gap-2 pl-3 py-1.5 border-l-2 ${isUrgent ? "border-warning" : "border-border"}`}>
      <Clock className={`w-4 h-4 shrink-0 ${isUrgent ? "text-warning" : "text-muted-foreground"}`} />
      <div>
        <p className={`text-sm font-medium ${isUrgent ? "text-warning" : "text-foreground"}`}>
          Tempo restante para anexar nota
        </p>
        <div className="flex gap-2 text-xs font-mono tabular-nums text-muted-foreground">
          {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
          <span>{timeLeft.hours.toString().padStart(2, "0")}h</span>
          <span>{timeLeft.minutes.toString().padStart(2, "0")}m</span>
          <span>{timeLeft.seconds.toString().padStart(2, "0")}s</span>
        </div>
      </div>
    </div>
  )
}
