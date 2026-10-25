import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { tipoMaterialApi } from "@/lib/api"
import type {
  TipoMaterial,
  CreateTipoMaterialPayload,
  UpdateTipoMaterialPayload,
} from "@/lib/type/tipo-material"

const crud = createCrudHooks<TipoMaterial, CreateTipoMaterialPayload, UpdateTipoMaterialPayload>(
  "/tipo-material",
  tipoMaterialApi,
)

export function useTipoMateriales() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { tipoMateriales: data, isLoading, error, mutate }
}

export function useCreateTipoMaterial() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createTipoMaterial: trigger, isLoading, error }
}

export function useUpdateTipoMaterial() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateTipoMaterial: trigger, isLoading, error }
}

export function useDeleteTipoMaterial() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteTipoMaterial: trigger, isLoading, error }
}
