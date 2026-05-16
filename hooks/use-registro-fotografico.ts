import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, registroFotograficoApi } from "@/lib/api"
import type {
  RegistroFotografico,
  CreateRegistroFotograficoPayload,
  UpdateRegistroFotograficoPayload,
} from "@/lib/type/registro-fotografico"

export function useRegistrosFotograficos() {
  const { data, isLoading, error, mutate } = useSWR<RegistroFotografico[]>("/registro-fotografico", fetcher)
  return { registros: data ?? [], isLoading, error, mutate }
}

export function useCreateRegistroFotografico() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/registro-fotografico",
    (_key: string, { arg }: { arg: CreateRegistroFotograficoPayload }) =>
      registroFotograficoApi.create(arg),
  )
  return { createRegistro: trigger, isLoading: isMutating, error }
}

export function useUpdateRegistroFotografico() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/registro-fotografico",
    (_key: string, { arg }: { arg: { id: number } & UpdateRegistroFotograficoPayload }) => {
      const { id, ...payload } = arg
      return registroFotograficoApi.update(id, payload)
    },
  )
  return { updateRegistro: trigger, isLoading: isMutating, error }
}

export function useDeleteRegistroFotografico() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/registro-fotografico",
    (_key: string, { arg }: { arg: number }) => registroFotograficoApi.remove(arg),
  )
  return { deleteRegistro: trigger, isLoading: isMutating, error }
}
