import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, donantesApi, tipoDonanteApi } from "@/lib/api"
import type {
  Donante,
  TipoDonante,
  CreateDonantePayload,
  UpdateDonantePayload,
  CreateTipoDonantePayload,
  UpdateTipoDonantePayload,
} from "@/lib/type/donante"

export function useDonantes() {
  const { data, isLoading, error, mutate } = useSWR<Donante[]>("/donantes", fetcher)
  return { donantes: data ?? [], isLoading, error, mutate }
}

export function useTipoDonantes() {
  const { data, isLoading, error, mutate } = useSWR<TipoDonante[]>("/tipo-donante", fetcher)
  return { tipos: data ?? [], isLoading, error, mutate }
}

export function useCreateDonante() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/donantes",
    (_key: string, { arg }: { arg: CreateDonantePayload }) => donantesApi.create(arg),
  )
  return { createDonante: trigger, isLoading: isMutating, error }
}

export function useUpdateDonante() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/donantes",
    (_key: string, { arg }: { arg: { id: number } & UpdateDonantePayload }) => {
      const { id, ...payload } = arg
      return donantesApi.update(id, payload)
    },
  )
  return { updateDonante: trigger, isLoading: isMutating, error }
}

export function useDeleteDonante() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/donantes",
    (_key: string, { arg }: { arg: number }) => donantesApi.remove(arg),
  )
  return { deleteDonante: trigger, isLoading: isMutating, error }
}

export function useCreateTipoDonante() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-donante",
    (_key: string, { arg }: { arg: CreateTipoDonantePayload }) => tipoDonanteApi.create(arg),
  )
  return { createTipo: trigger, isLoading: isMutating, error }
}

export function useUpdateTipoDonante() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-donante",
    (_key: string, { arg }: { arg: { id: number } & UpdateTipoDonantePayload }) => {
      const { id, ...payload } = arg
      return tipoDonanteApi.update(id, payload)
    },
  )
  return { updateTipo: trigger, isLoading: isMutating, error }
}

export function useDeleteTipoDonante() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-donante",
    (_key: string, { arg }: { arg: number }) => tipoDonanteApi.remove(arg),
  )
  return { deleteTipo: trigger, isLoading: isMutating, error }
}
