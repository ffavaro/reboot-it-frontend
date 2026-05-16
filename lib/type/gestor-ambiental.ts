export interface GestorAmbiental {
  id: number
  razonSocial: string
  cuit: string | null
  habilitacion: string | null
  contacto: string | null
  isActive: boolean
}

export interface CreateGestorAmbientalPayload {
  razonSocial: string
  cuit?: string
  habilitacion?: string
  contacto?: string
}

export interface UpdateGestorAmbientalPayload {
  razonSocial?: string
  cuit?: string
  habilitacion?: string
  contacto?: string
}
