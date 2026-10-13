import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, metodoDestruccionApi } from "@/lib/api"
import type {
  CreateMetodoDestruccionPayload,
  UpdateMetodoDestruccionPayload,
} from "@/lib/api/metodo-destruccion"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"

export function useMetodosDestruccion() {
  const { data, isLoading, error, mutate } = useSWR<MetodoDestruccion[]>("/metodo-destruccion", fetcher)
  return { metodos: data ?? [], isLoading, error, mutate }
}

export function useCreateMetodoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/metodo-destruccion",
    (_key: string, { arg }: { arg: CreateMetodoDestruccionPayload }) =>
      metodoDestruccionApi.create(arg),
  )
  return { createMetodo: trigger, isLoading: isMutating, error }
}

export function useUpdateMetodoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/metodo-destruccion",
    (_key: string, { arg }: { arg: { id: number } & UpdateMetodoDestruccionPayload }) => {
      const { id, ...payload } = arg
      return metodoDestruccionApi.update(id, payload)
    },
  )
  return { updateMetodo: trigger, isLoading: isMutating, error }
}

export function useDeleteMetodoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/metodo-destruccion",
    (_key: string, { arg }: { arg: number }) => metodoDestruccionApi.remove(arg),
  )
  return { deleteMetodo: trigger, isLoading: isMutating, error }
}
