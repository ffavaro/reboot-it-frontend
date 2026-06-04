import type { Lote } from "./lote"

export interface RegistroFotografico {
  id: number
  loteId: number | null
  turnoId: number | null
  urlImagen: string
  fecha: string | null
  isActive: boolean
  lote?: Lote | null
}

export interface CreateRegistroFotograficoPayload {
  loteId?: number
  turnoId?: number
  urlImagen: string
  fecha?: string
}

export interface UpdateRegistroFotograficoPayload {
  loteId?: number
  turnoId?: number | null
  urlImagen?: string
  fecha?: string | null
}
