import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  allowedRoles?: string[]
  icon?: LucideIcon
}

export interface NavSection {
  title: string
  url: string
  allowedRoles?: string[]
  items: NavItem[]
}