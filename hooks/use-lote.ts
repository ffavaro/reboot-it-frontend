import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { loteApi } from "@/lib/api"
import type { Lote, CreateLotePayload, UpdateLotePayload } from "@/lib/type/lote"

const crud = createCrudHooks<Lote, CreateLotePayload, UpdateLotePayload>("/lote", loteApi)

// habilitado=false: no consulta (el rol no tiene la pantalla Lotes)
export function useLotes(habilitado = true) {
  const { data, isLoading, error, mutate } = crud.useList(habilitado)
  return { lotes: data, isLoading, error, mutate }
}

export function useCreateLote() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createLote: trigger, isLoading, error }
}

export function useUpdateLote() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateLote: trigger, isLoading, error }
}

export function useDeleteLote() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteLote: trigger, isLoading, error }
}
