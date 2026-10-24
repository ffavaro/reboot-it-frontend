import type { LucideIcon } from "lucide-react"
import type { Permisos } from "@/lib/type/permisos"

// Pantalla (ruta) dentro de una opción del menú. La clave es la de la tabla pantalla del backend: de ella sale quién la puede ver.
export interface NavTab {
  title: string
  url: string
  clave: string
}

export interface NavItem {
  title: string
  // Ruta y clave de la primera pantalla: las de una opción simple, o las de la primera pestaña
  url: string
  clave: string
  icon?: LucideIcon
  // Opción con varias pantallas: se ve si el rol puede ver al menos una, y cada pestaña según su propia clave
  tabs?: NavTab[]
  // Condición extra para mostrar la opción (por ejemplo, "solo quien ve lo propio")
  visibleSi?: (permisos: Permisos | undefined) => boolean
}

export interface NavSection {
  title: string
  url: string
  // Icono del menú principal (a la izquierda del título)
  icon?: LucideIcon
  items: NavItem[]
}
