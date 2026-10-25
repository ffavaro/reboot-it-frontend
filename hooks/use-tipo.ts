import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { tipoApi } from "@/lib/api"
import type { Tipo, CreateTipoPayload, UpdateTipoPayload } from "@/lib/type/tipo"

const crud = createCrudHooks<Tipo, CreateTipoPayload, UpdateTipoPayload>("/tipo", tipoApi)

export function useTipos() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { tipos: data, isLoading, error, mutate }
}

export function useCreateTipo() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createTipo: trigger, isLoading, error }
}

export function useUpdateTipo() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateTipo: trigger, isLoading, error }
}

export function useDeleteTipo() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteTipo: trigger, isLoading, error }
}
