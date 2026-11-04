export interface RecorridoKm {
  id: number
  vehiculoId: number
  hojaRutaId: number | null
  kmInicial: number
  kmFinal: number | null
  kmEstimado: number | string | null
  createdAt: string
}

export interface RangoFechas {
  desde: string
  hasta: string
}
