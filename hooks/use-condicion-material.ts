import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { condicionMaterialApi } from "@/lib/api"
import type {
  CondicionMaterial,
  CreateCondicionMaterialPayload,
  UpdateCondicionMaterialPayload,
} from "@/lib/type/condicion-material"

const crud = createCrudHooks<CondicionMaterial, CreateCondicionMaterialPayload, UpdateCondicionMaterialPayload>(
  "/condicion-material",
  condicionMaterialApi,
)

export function useCondicionesMaterial() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { condiciones: data, isLoading, error, mutate }
}

export function useCreateCondicionMaterial() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createCondicion: trigger, isLoading, error }
}

export function useUpdateCondicionMaterial() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateCondicion: trigger, isLoading, error }
}

export function useDeleteCondicionMaterial() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteCondicion: trigger, isLoading, error }
}
