import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { marcaApi } from "@/lib/api"
import type { Marca, CreateMarcaPayload, UpdateMarcaPayload } from "@/lib/type/marca"

const crud = createCrudHooks<Marca, CreateMarcaPayload, UpdateMarcaPayload>("/marca", marcaApi)

export function useMarcas() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { marcas: data, isLoading, error, mutate }
}

export function useCreateMarca() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createMarca: trigger, isLoading, error }
}

export function useUpdateMarca() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateMarca: trigger, isLoading, error }
}

export function useDeleteMarca() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteMarca: trigger, isLoading, error }
}
