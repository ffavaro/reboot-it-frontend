import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { metodoDestruccionApi } from "@/lib/api"
import type {
  CreateMetodoDestruccionPayload,
  UpdateMetodoDestruccionPayload,
} from "@/lib/api/metodo-destruccion"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"

const crud = createCrudHooks<MetodoDestruccion, CreateMetodoDestruccionPayload, UpdateMetodoDestruccionPayload>(
  "/metodo-destruccion",
  metodoDestruccionApi,
)

export function useMetodosDestruccion() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { metodos: data, isLoading, error, mutate }
}

export function useCreateMetodoDestruccion() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createMetodo: trigger, isLoading, error }
}

export function useUpdateMetodoDestruccion() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateMetodo: trigger, isLoading, error }
}

export function useDeleteMetodoDestruccion() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteMetodo: trigger, isLoading, error }
}
