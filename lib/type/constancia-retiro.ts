import type { Empleado } from "./user"

export interface ConstanciaRetiro {
  id: number
  retiroId: number
  fechaEmision: string | null
  observaciones: string | null
  tecnicoId: number | null
  isActive: boolean
  tecnico?: Empleado
}

export interface CreateConstanciaRetiroPayload {
  retiroId: number
  fechaEmision?: string
  observaciones?: string
  tecnicoId?: number
}

export interface UpdateConstanciaRetiroPayload {
  retiroId?: number
  fechaEmision?: string | null
  observaciones?: string | null
  tecnicoId?: number | null
}

export interface DatosConstanciaRetiro {
  constanciaId: number
  turnoId: number | null
  donacionId: number | null
  fechaEmision: string | null
  fechaRetiro: string | null
  observaciones: string | null
  donante: { nombre: string; telefono: string | null }
  direccion: string | null
  transportista: { nombre: string; apellido: string; cuitDni: string | null } | null
  vehiculo: { patente: string; marca: string; modelo: string } | null
  pesoEstimadoKg: number | string | null
  materiales: { tipo: string; cantidad: number | null }[]
}
