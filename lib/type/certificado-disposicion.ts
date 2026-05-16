import type { Lote } from "./lote"
import type { GestorAmbiental } from "./gestor-ambiental"

export interface CertificadoDisposicion {
  id: number
  loteId: number
  gestorAmbientalId: number
  fechaEmision: string | null
  numeroCertificado: string | null
  terminosCondiciones: string | null
  isActive: boolean
  lote?: Lote
  gestorAmbiental?: GestorAmbiental
}

export interface CreateCertificadoDisposicionPayload {
  loteId: number
  gestorAmbientalId: number
  fechaEmision?: string
  numeroCertificado?: string
  terminosCondiciones?: string
}

export interface UpdateCertificadoDisposicionPayload {
  loteId?: number
  gestorAmbientalId?: number
  fechaEmision?: string | null
  numeroCertificado?: string | null
  terminosCondiciones?: string | null
}
