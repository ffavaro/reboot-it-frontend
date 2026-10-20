import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  // Clave de la pantalla en la matriz de permisos (tabla pantalla del backend)
  clave: string
  icon?: LucideIcon
}

export interface NavSection {
  title: string
  url: string
  items: NavItem[]
}
