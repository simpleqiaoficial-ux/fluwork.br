"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingBadgeProps {
  icon: LucideIcon
  label: string
  className?: string
  delay?: number
  duration?: number
}

/** Card flutuante representando um módulo, usado ao redor do mockup do dashboard no Hero. */
export function FloatingBadge({ icon: Icon, label, className, delay = 0, duration = 4 }: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay },
      }}
      className={cn(
        "absolute flex items-center gap-2 rounded-xl border border-border/60 bg-card/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </motion.div>
  )
}
