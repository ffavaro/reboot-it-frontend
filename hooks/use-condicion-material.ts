import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, condicionMaterialApi } from "@/lib/api"
import type {
  CondicionMaterial,
  CreateCondicionMaterialPayload,
  UpdateCondicionMaterialPayload,
} from "@/lib/type/condicion-material"

export function useCondicionesMaterial() {
  const { data, isLoading, error, mutate } = useSWR<CondicionMaterial[]>("/condicion-material", fetcher)
  return { condiciones: data ?? [], isLoading, error, mutate }
}

export function useCreateCondicionMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/condicion-material",
    (_key: string, { arg }: { arg: CreateCondicionMaterialPayload }) => condicionMaterialApi.create(arg),
  )
  return { createCondicion: trigger, isLoading: isMutating, error }
}

export function useUpdateCondicionMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/condicion-material",
    (_key: string, { arg }: { arg: { id: number } & UpdateCondicionMaterialPayload }) => {
      const { id, ...payload } = arg
      return condicionMaterialApi.update(id, payload)
    },
  )
  return { updateCondicion: trigger, isLoading: isMutating, error }
}

export function useDeleteCondicionMaterial() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/condicion-material",
    (_key: string, { arg }: { arg: number }) => condicionMaterialApi.remove(arg),
  )
  return { deleteCondicion: trigger, isLoading: isMutating, error }
}
