import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, modeloApi } from "@/lib/api"
import type { CreateModeloPayload, UpdateModeloPayload } from "@/lib/type/modelo"

export function useModelos() {
  const { data, isLoading, error, mutate } = useSWR("/modelo", fetcher)
  return { modelos: data ?? [], isLoading, error, mutate }
}

export function useCreateModelo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/modelo",
    (_key: string, { arg }: { arg: CreateModeloPayload }) => modeloApi.create(arg),
  )
  return { createModelo: trigger, isLoading: isMutating, error }
}

export function useUpdateModelo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/modelo",
    (_key: string, { arg }: { arg: { id: number } & UpdateModeloPayload }) => {
      const { id, ...payload } = arg
      return modeloApi.update(id, payload)
    },
  )
  return { updateModelo: trigger, isLoading: isMutating, error }
}

export function useDeleteModelo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/modelo",
    (_key: string, { arg }: { arg: number }) => modeloApi.remove(arg),
  )
  return { deleteModelo: trigger, isLoading: isMutating, error }
}
