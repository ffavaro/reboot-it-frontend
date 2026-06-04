import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, tipoApi } from "@/lib/api"
import type { Tipo, CreateTipoPayload, UpdateTipoPayload } from "@/lib/type/tipo"

export function useTipos() {
  const { data, isLoading, error, mutate } = useSWR<Tipo[]>("/tipo", fetcher)
  return { tipos: data ?? [], isLoading, error, mutate }
}

export function useCreateTipo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo",
    (_key: string, { arg }: { arg: CreateTipoPayload }) => tipoApi.create(arg),
  )
  return { createTipo: trigger, isLoading: isMutating, error }
}

export function useUpdateTipo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo",
    (_key: string, { arg }: { arg: { id: number } & UpdateTipoPayload }) => {
      const { id, ...payload } = arg
      return tipoApi.update(id, payload)
    },
  )
  return { updateTipo: trigger, isLoading: isMutating, error }
}

export function useDeleteTipo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo",
    (_key: string, { arg }: { arg: number }) => tipoApi.remove(arg),
  )
  return { deleteTipo: trigger, isLoading: isMutating, error }
}
