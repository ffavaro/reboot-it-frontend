import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { constanciaRetiroApi } from "@/lib/api"
import type {
  ConstanciaRetiro,
  CreateConstanciaRetiroPayload,
  UpdateConstanciaRetiroPayload,
} from "@/lib/type/constancia-retiro"

const crud = createCrudHooks<ConstanciaRetiro, CreateConstanciaRetiroPayload, UpdateConstanciaRetiroPayload>(
  "/constancia-retiro",
  constanciaRetiroApi,
)

export function useConstanciasRetiro() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { constancias: data, isLoading, error, mutate }
}

export function useCreateConstanciaRetiro() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createConstancia: trigger, isLoading, error }
}

export function useUpdateConstanciaRetiro() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateConstancia: trigger, isLoading, error }
}

export function useDeleteConstanciaRetiro() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteConstancia: trigger, isLoading, error }
}
