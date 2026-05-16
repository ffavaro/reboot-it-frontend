import type { Lote } from "./lote"

export interface RegistroFotografico {
  id: number
  loteId: number
  urlImagen: string
  fecha: string | null
  isActive: boolean
  lote?: Lote
}

export interface CreateRegistroFotograficoPayload {
  loteId: number
  urlImagen: string
  fecha?: string
}

export interface UpdateRegistroFotograficoPayload {
  loteId?: number
  urlImagen?: string
  fecha?: string | null
}
