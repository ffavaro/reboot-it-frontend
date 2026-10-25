import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { materialApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type { Material, CreateMaterialPayload, UpdateMaterialPayload, ClasificarMaterialPayload, ReporteInventario, ReporteInventarioQuery } from "@/lib/type/material"

const crud = createCrudHooks<Material, CreateMaterialPayload, UpdateMaterialPayload>("/material", materialApi)

export function useMateriales() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { materiales: data, isLoading, error, mutate }
}

export function useMaterialReporte(params: ReporteInventarioQuery) {
  const { data, isLoading, error, mutate } = useSWR<ReporteInventario[]>(
    ["/material/reporte", params],
    () => materialApi.getReporte(params),
  )
  return { materiales: data ?? [], isLoading, error, mutate }
}

export function useCreateMaterial() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createMaterial: trigger, isLoading, error }
}

export function useUpdateMaterial() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateMaterial: trigger, isLoading, error }
}

export function useDeleteMaterial() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteMaterial: trigger, isLoading, error }
}

export function useClasificarMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/material",
    (_key: string, { arg }: { arg: { id: number } & ClasificarMaterialPayload }) => {
      const { id, ...payload } = arg
      return materialApi.clasificar(id, payload)
    },
  )
  return { clasificarMaterial: trigger, isLoading: isMutating, error }
}
