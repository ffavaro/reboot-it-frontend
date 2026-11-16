import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import { crudApi } from "./crud"

export interface CreateEstadoProcesoDestruccionPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateEstadoProcesoDestruccionPayload {
  nombre?: string
  descripcion?: string | null
}

export const estadoProcesoDestruccionApi = crudApi<
  EstadoProcesoDestruccion,
  CreateEstadoProcesoDestruccionPayload,
  UpdateEstadoProcesoDestruccionPayload
>("/estado-proceso-destruccion")
