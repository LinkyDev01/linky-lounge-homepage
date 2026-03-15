import type { LucideIcon } from "lucide-react"

export type BrandColor = "sage" | "mint" | "rose" | "mustard"

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export interface StatItem {
  value: string
  label: string
}

export interface ProcessStep {
  step: string
  title: string
  description: string
}
