import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, turnoApi } from "@/lib/api"
import type { Turno, CreateTurnoPayload, UpdateTurnoPayload } from "@/lib/type/turno"

export function useTurnos() {
  const { data, isLoading, error, mutate } = useSWR<Turno[]>("/turno", fetcher)
  return { turnos: data ?? [], isLoading, error, mutate }
}

export function useCreateTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/turno",
    (_key: string, { arg }: { arg: CreateTurnoPayload }) => turnoApi.create(arg),
  )
  return { createTurno: trigger, isLoading: isMutating, error }
}

export function useUpdateTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/turno",
    (_key: string, { arg }: { arg: { id: number } & UpdateTurnoPayload }) => {
      const { id, ...payload } = arg
      return turnoApi.update(id, payload)
    },
  )
  return { updateTurno: trigger, isLoading: isMutating, error }
}

export function useDeleteTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/turno",
    (_key: string, { arg }: { arg: number }) => turnoApi.remove(arg),
  )
  return { deleteTurno: trigger, isLoading: isMutating, error }
}
