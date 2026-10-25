import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { modeloApi } from "@/lib/api"
import type { Modelo, CreateModeloPayload, UpdateModeloPayload } from "@/lib/type/modelo"

const crud = createCrudHooks<Modelo, CreateModeloPayload, UpdateModeloPayload>("/modelo", modeloApi)

export function useModelos() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { modelos: data, isLoading, error, mutate }
}

export function useCreateModelo() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createModelo: trigger, isLoading, error }
}

export function useUpdateModelo() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateModelo: trigger, isLoading, error }
}

export function useDeleteModelo() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteModelo: trigger, isLoading, error }
}
