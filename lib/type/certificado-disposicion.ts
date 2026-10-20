import type { Lote } from "./lote"
import type { GestorAmbiental } from "./gestor-ambiental"

export interface CertificadoDisposicion {
  id: number
  loteId: number
  gestorAmbientalId: number
  fechaEmision: string | null
  numeroCertificado: string | null
  terminosCondiciones: string | null
  // Foto o PDF del certificado de disposición final (null en los certificados anteriores a esta función)
  archivoFinalUrl: string | null
  isActive: boolean
  lote?: Lote
  gestorAmbiental?: GestorAmbiental
}

export interface CreateCertificadoDisposicionPayload {
  loteId: number
  gestorAmbientalId: number
  terminosCondiciones?: string
  // URL del archivo ya subido (foto o PDF); obligatorio al crear
  archivoFinalUrl: string
}

export interface UpdateCertificadoDisposicionPayload {
  loteId?: number
  gestorAmbientalId?: number
  terminosCondiciones?: string | null
}
