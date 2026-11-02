import type { LucideIcon } from "lucide-react"

export type Perfil = "equipo" | "donante" | "transportista"

export interface Destino {
  etiqueta: string
  ruta: string
  perfiles?: Perfil[]
}

export interface EntradaMenu {
  etiqueta: string
  icono: LucideIcon
  destinos: Destino[]
  perfiles?: Perfil[]
}

export interface GrupoMenu {
  etiqueta: string
  icono: LucideIcon
  entradas: EntradaMenu[]
}

export interface Ubicacion {
  entrada: EntradaMenu
  destino: Destino
}
