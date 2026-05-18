export interface Lote {
  id: number
  donacionId: number
  pesoBrutoKg: number | null
  observaciones: string | null
  isActive: boolean
}

export interface CreateLotePayload {
  donacionId: number
  pesoBrutoKg?: number
  observaciones?: string
}

export interface UpdateLotePayload {
  donacionId?: number
  pesoBrutoKg?: number | null
  observaciones?: string | null
}
