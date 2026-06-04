import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, medioAlmacenamientoApi } from "@/lib/api"
import type {
  MedioAlmacenamiento,
  CreateMedioAlmacenamientoPayload,
  UpdateMedioAlmacenamientoPayload,
} from "@/lib/type/medio-almacenamiento"

export function useMediosAlmacenamiento() {
  const { data, isLoading, error, mutate } = useSWR<MedioAlmacenamiento[]>("/medio-almacenamiento", fetcher)
  return { medios: data ?? [], isLoading, error, mutate }
}

export function useCreateMedioAlmacenamiento() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/medio-almacenamiento",
    (_key: string, { arg }: { arg: CreateMedioAlmacenamientoPayload }) =>
      medioAlmacenamientoApi.create(arg),
  )
  return { createMedio: trigger, isLoading: isMutating, error }
}

export function useUpdateMedioAlmacenamiento() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/medio-almacenamiento",
    (_key: string, { arg }: { arg: { id: number } & UpdateMedioAlmacenamientoPayload }) => {
      const { id, ...payload } = arg
      return medioAlmacenamientoApi.update(id, payload)
    },
  )
  return { updateMedio: trigger, isLoading: isMutating, error }
}

export function useDeleteMedioAlmacenamiento() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/medio-almacenamiento",
    (_key: string, { arg }: { arg: number }) => medioAlmacenamientoApi.remove(arg),
  )
  return { deleteMedio: trigger, isLoading: isMutating, error }
}
