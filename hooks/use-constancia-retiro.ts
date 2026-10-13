import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, constanciaRetiroApi } from "@/lib/api"
import type {
  ConstanciaRetiro,
  CreateConstanciaRetiroPayload,
  UpdateConstanciaRetiroPayload,
} from "@/lib/type/constancia-retiro"

export function useConstanciasRetiro() {
  const { data, isLoading, error, mutate } = useSWR<ConstanciaRetiro[]>("/constancia-retiro", fetcher)
  return { constancias: data ?? [], isLoading, error, mutate }
}

export function useCreateConstanciaRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/constancia-retiro",
    (_key: string, { arg }: { arg: CreateConstanciaRetiroPayload }) => constanciaRetiroApi.create(arg),
  )
  return { createConstancia: trigger, isLoading: isMutating, error }
}

export function useUpdateConstanciaRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/constancia-retiro",
    (_key: string, { arg }: { arg: { id: number } & UpdateConstanciaRetiroPayload }) => {
      const { id, ...payload } = arg
      return constanciaRetiroApi.update(id, payload)
    },
  )
  return { updateConstancia: trigger, isLoading: isMutating, error }
}

export function useDeleteConstanciaRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/constancia-retiro",
    (_key: string, { arg }: { arg: number }) => constanciaRetiroApi.remove(arg),
  )
  return { deleteConstancia: trigger, isLoading: isMutating, error }
}
