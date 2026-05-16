import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, loteApi } from "@/lib/api"
import type { Lote, CreateLotePayload, UpdateLotePayload } from "@/lib/type/lote"

export function useLotes() {
  const { data, isLoading, error, mutate } = useSWR<Lote[]>("/lote", fetcher)
  return { lotes: data ?? [], isLoading, error, mutate }
}

export function useCreateLote() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/lote",
    (_key: string, { arg }: { arg: CreateLotePayload }) => loteApi.create(arg),
  )
  return { createLote: trigger, isLoading: isMutating, error }
}

export function useUpdateLote() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/lote",
    (_key: string, { arg }: { arg: { id: number } & UpdateLotePayload }) => {
      const { id, ...payload } = arg
      return loteApi.update(id, payload)
    },
  )
  return { updateLote: trigger, isLoading: isMutating, error }
}

export function useDeleteLote() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/lote",
    (_key: string, { arg }: { arg: number }) => loteApi.remove(arg),
  )
  return { deleteLote: trigger, isLoading: isMutating, error }
}
