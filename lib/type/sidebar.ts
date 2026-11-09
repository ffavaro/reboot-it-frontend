import type { LucideIcon } from "lucide-react"
import { Alcance } from "./permisos"

export interface Destino {
  etiqueta: string
  ruta: string
  alcances?: Alcance[]
}

export interface EntradaMenu {
  etiqueta: string
  icono: LucideIcon
  destinos: Destino[]
  alcances?: Alcance[]
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
