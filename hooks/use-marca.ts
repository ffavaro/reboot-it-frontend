import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, marcaApi } from "@/lib/api"
import type { Marca, CreateMarcaPayload, UpdateMarcaPayload } from "@/lib/type/marca"

export function useMarcas() {
  const { data, isLoading, error, mutate } = useSWR<Marca[]>("/marca", fetcher)
  return { marcas: data ?? [], isLoading, error, mutate }
}

export function useCreateMarca() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/marca",
    (_key: string, { arg }: { arg: CreateMarcaPayload }) => marcaApi.create(arg),
  )
  return { createMarca: trigger, isLoading: isMutating, error }
}

export function useUpdateMarca() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/marca",
    (_key: string, { arg }: { arg: { id: number } & UpdateMarcaPayload }) => {
      const { id, ...payload } = arg
      return marcaApi.update(id, payload)
    },
  )
  return { updateMarca: trigger, isLoading: isMutating, error }
}

export function useDeleteMarca() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/marca",
    (_key: string, { arg }: { arg: number }) => marcaApi.remove(arg),
  )
  return { deleteMarca: trigger, isLoading: isMutating, error }
}
