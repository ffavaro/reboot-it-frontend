import type { Lote } from "./lote"
import type { GestorAmbiental } from "./gestor-ambiental"

export interface CertificadoDisposicion {
  id: number
  loteId: number
  gestorAmbientalId: number
  fechaEmision: string | null
  numeroCertificado: string | null
  terminosCondiciones: string | null
  archivoFinalUrl: string | null
  isActive: boolean
  lote?: Lote
  gestorAmbiental?: GestorAmbiental
}

export interface CreateCertificadoDisposicionPayload {
  loteId: number
  gestorAmbientalId: number
  terminosCondiciones?: string
  archivoFinalUrl: string
}

export interface UpdateCertificadoDisposicionPayload {
  loteId?: number
  gestorAmbientalId?: number
  terminosCondiciones?: string | null
}


export interface DatosCertificadoDisposicion {
  certificadoId: number
  numeroCertificado: string | null
  fechaEmision: string | null
  terminosCondiciones: string | null
  loteId: number
  pesoBrutoKg: number | string | null
  donacionId: number | null
  donante: { nombre: string; razonSocial: string | null; telefono: string | null; direccion: string | null }
  gestor: { razonSocial: string; cuit: string | null; habilitacion: string | null; contacto: string | null } | null
  materiales: { tipo: string; condicion: string; cantidad: number }[]
}
