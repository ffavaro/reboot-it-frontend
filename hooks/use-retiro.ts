import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, retiroApi } from "@/lib/api"
import type { Retiro, CreateRetiroPayload, UpdateRetiroPayload } from "@/lib/type/retiro"

export function useRetiros() {
  const { data, isLoading, error, mutate } = useSWR<Retiro[]>("/retiro", fetcher)
  return { retiros: data ?? [], isLoading, error, mutate }
}

export function useCreateRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/retiro",
    (_key: string, { arg }: { arg: CreateRetiroPayload }) => retiroApi.create(arg),
  )
  return { createRetiro: trigger, isLoading: isMutating, error }
}

export function useUpdateRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/retiro",
    (_key: string, { arg }: { arg: { id: number } & UpdateRetiroPayload }) => {
      const { id, ...payload } = arg
      return retiroApi.update(id, payload)
    },
  )
  return { updateRetiro: trigger, isLoading: isMutating, error }
}

export function useDeleteRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/retiro",
    (_key: string, { arg }: { arg: number }) => retiroApi.remove(arg),
  )
  return { deleteRetiro: trigger, isLoading: isMutating, error }
}
