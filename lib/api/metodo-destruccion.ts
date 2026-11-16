import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import { crudApi } from "./crud"

export interface CreateMetodoDestruccionPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateMetodoDestruccionPayload {
  nombre?: string
  descripcion?: string | null
}

export const metodoDestruccionApi = crudApi<
  MetodoDestruccion,
  CreateMetodoDestruccionPayload,
  UpdateMetodoDestruccionPayload
>("/metodo-destruccion")
