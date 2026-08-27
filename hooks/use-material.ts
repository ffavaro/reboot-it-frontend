import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, materialApi } from "@/lib/api"
import type { Material, CreateMaterialPayload, UpdateMaterialPayload, ClasificarMaterialPayload, ReporteInventario, ReporteInventarioQuery } from "@/lib/type/material"

export function useMateriales() {
  const { data, isLoading, error, mutate } = useSWR<Material[]>("/material", fetcher)
  return { materiales: data ?? [], isLoading, error, mutate }
}

export function useMaterialReporte(params: ReporteInventarioQuery) {
  const { data, isLoading, error, mutate } = useSWR<ReporteInventario[]>(
    ["/material/reporte", params],
    () => materialApi.getReporte(params),
  )
  return { materiales: data ?? [], isLoading, error, mutate }
}

export function useCreateMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/material",
    (_key: string, { arg }: { arg: CreateMaterialPayload }) => materialApi.create(arg),
  )
  return { createMaterial: trigger, isLoading: isMutating, error }
}

export function useUpdateMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/material",
    (_key: string, { arg }: { arg: { id: number } & UpdateMaterialPayload }) => {
      const { id, ...payload } = arg
      return materialApi.update(id, payload)
    },
  )
  return { updateMaterial: trigger, isLoading: isMutating, error }
}

export function useDeleteMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/material",
    (_key: string, { arg }: { arg: number }) => materialApi.remove(arg),
  )
  return { deleteMaterial: trigger, isLoading: isMutating, error }
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

