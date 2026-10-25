import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { retiroApi } from "@/lib/api"
import type { Retiro, CreateRetiroPayload, UpdateRetiroPayload } from "@/lib/type/retiro"

const crud = createCrudHooks<Retiro, CreateRetiroPayload, UpdateRetiroPayload>("/retiro", retiroApi)

export function useRetiros() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { retiros: data, isLoading, error, mutate }
}

export function useCreateRetiro() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createRetiro: trigger, isLoading, error }
}

export function useUpdateRetiro() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateRetiro: trigger, isLoading, error }
}

export function useDeleteRetiro() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteRetiro: trigger, isLoading, error }
}
