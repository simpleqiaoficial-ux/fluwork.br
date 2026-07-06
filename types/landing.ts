import type { LucideIcon } from "lucide-react"

export interface BenefitItem {
  icon: LucideIcon
  title: string
  description: string
}

export interface ModuleItem {
  icon: LucideIcon
  title: string
  description: string
  href: string
  badge?: string
}

export interface HowItWorksStep {
  step: number
  title: string
  description: string
  icon: LucideIcon
}

export interface SecurityItem {
  icon: LucideIcon
  title: string
  description: string
}

export interface PricingPlan {
  name: string
  description: string
  users: string
  highlighted?: boolean
  features: string[]
  ctaLabel: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface NavLink {
  label: string
  href: string
}
