import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { clasificacionApi } from "@/lib/api"
import type { Clasificacion, CreateClasificacionPayload, UpdateClasificacionPayload } from "@/lib/type/clasificacion"

const crud = createCrudHooks<Clasificacion, CreateClasificacionPayload, UpdateClasificacionPayload>(
  "/clasificacion",
  clasificacionApi,
)

export function useClasificaciones() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { clasificaciones: data, isLoading, error, mutate }
}

export function useCreateClasificacion() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createClasificacion: trigger, isLoading, error }
}

export function useUpdateClasificacion() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateClasificacion: trigger, isLoading, error }
}

export function useDeleteClasificacion() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteClasificacion: trigger, isLoading, error }
}
