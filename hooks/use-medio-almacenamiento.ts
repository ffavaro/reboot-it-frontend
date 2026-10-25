import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { medioAlmacenamientoApi } from "@/lib/api"
import type {
  MedioAlmacenamiento,
  CreateMedioAlmacenamientoPayload,
  UpdateMedioAlmacenamientoPayload,
} from "@/lib/type/medio-almacenamiento"

const crud = createCrudHooks<MedioAlmacenamiento, CreateMedioAlmacenamientoPayload, UpdateMedioAlmacenamientoPayload>(
  "/medio-almacenamiento",
  medioAlmacenamientoApi,
)

export function useMediosAlmacenamiento() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { medios: data, isLoading, error, mutate }
}

export function useCreateMedioAlmacenamiento() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createMedio: trigger, isLoading, error }
}

export function useUpdateMedioAlmacenamiento() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateMedio: trigger, isLoading, error }
}

export function useDeleteMedioAlmacenamiento() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteMedio: trigger, isLoading, error }
}
