import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { estadoProcesoDestruccionApi } from "@/lib/api"
import type {
  CreateEstadoProcesoDestruccionPayload,
  UpdateEstadoProcesoDestruccionPayload,
} from "@/lib/api/estado-proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"

const crud = createCrudHooks<EstadoProcesoDestruccion, CreateEstadoProcesoDestruccionPayload, UpdateEstadoProcesoDestruccionPayload>(
  "/estado-proceso-destruccion",
  estadoProcesoDestruccionApi,
)

export function useEstadosProcesoDestruccion() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { estados: data, isLoading, error, mutate }
}

export function useCreateEstadoProcesoDestruccion() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createEstado: trigger, isLoading, error }
}

export function useUpdateEstadoProcesoDestruccion() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateEstado: trigger, isLoading, error }
}

export function useDeleteEstadoProcesoDestruccion() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteEstado: trigger, isLoading, error }
}
