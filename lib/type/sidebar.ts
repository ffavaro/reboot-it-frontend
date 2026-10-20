import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  allowedRoles?: string[]
  // Solo el rol Admin lo ve y puede abrirlo
  soloAdmin?: boolean
  icon?: LucideIcon
}

export interface NavSection {
  title: string
  url: string
  allowedRoles?: string[]
  items: NavItem[]
}