export interface Lote {
  id: number
  donacionId: number
  pesoBrutoKg: number | null
  observaciones: string | null
  isActive: boolean
}
