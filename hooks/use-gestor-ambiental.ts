import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { gestorAmbientalApi } from "@/lib/api"
import type {
  GestorAmbiental,
  CreateGestorAmbientalPayload,
  UpdateGestorAmbientalPayload,
} from "@/lib/type/gestor-ambiental"

const crud = createCrudHooks<GestorAmbiental, CreateGestorAmbientalPayload, UpdateGestorAmbientalPayload>(
  "/gestor-ambiental",
  gestorAmbientalApi,
)

export function useGestoresAmbientales() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { gestores: data, isLoading, error, mutate }
}

export function useCreateGestorAmbiental() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createGestor: trigger, isLoading, error }
}

export function useUpdateGestorAmbiental() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateGestor: trigger, isLoading, error }
}

export function useDeleteGestorAmbiental() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteGestor: trigger, isLoading, error }
}
