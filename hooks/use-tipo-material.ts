import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, tipoMaterialApi } from "@/lib/api"
import type {
  TipoMaterial,
  CreateTipoMaterialPayload,
  UpdateTipoMaterialPayload,
} from "@/lib/type/tipo-material"

export function useTipoMateriales() {
  const { data, isLoading, error, mutate } = useSWR<TipoMaterial[]>("/tipo-material", fetcher)
  return { tipoMateriales: data ?? [], isLoading, error, mutate }
}

export function useCreateTipoMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-material",
    (_key: string, { arg }: { arg: CreateTipoMaterialPayload }) => tipoMaterialApi.create(arg),
  )
  return { createTipoMaterial: trigger, isLoading: isMutating, error }
}

export function useUpdateTipoMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-material",
    (_key: string, { arg }: { arg: { id: number } & UpdateTipoMaterialPayload }) => {
      const { id, ...payload } = arg
      return tipoMaterialApi.update(id, payload)
    },
  )
  return { updateTipoMaterial: trigger, isLoading: isMutating, error }
}

export function useDeleteTipoMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-material",
    (_key: string, { arg }: { arg: number }) => tipoMaterialApi.remove(arg),
  )
  return { deleteTipoMaterial: trigger, isLoading: isMutating, error }
}