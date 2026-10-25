import useSWRMutation from "swr/mutation"
import { turnoApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type { Turno, CreateTurnoPayload, UpdateTurnoPayload, AsignarEmpleadoPayload } from "@/lib/type/turno"

const crud = createCrudHooks<Turno, CreateTurnoPayload, UpdateTurnoPayload>("/turno", turnoApi)

export function useTurnos() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { turnos: data, isLoading, error, mutate }
}

export function useCreateTurno() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createTurno: trigger, isLoading, error }
}

export function useUpdateTurno() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateTurno: trigger, isLoading, error }
}

export function useDeleteTurno() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteTurno: trigger, isLoading, error }
}

export function useAsignarEmpleadoTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/turno",
    (_key: string, { arg }: { arg: { id: number } & AsignarEmpleadoPayload }) => {
      const { id, ...payload } = arg
      return turnoApi.asignar(id, payload)
    },
  )
  return { asignarEmpleado: trigger, isLoading: isMutating, error }
}

export function useConfirmarRecepcionTurno() {
  const { trigger, isMutating } = useSWRMutation(
    "/turno",
    (_key: string, { arg }: { arg: number }) => turnoApi.confirmarRecepcion(arg),
  )
  return { confirmarRecepcion: trigger, isLoading: isMutating }
}

export function useFinalizarTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/turno",
    (_key: string, { arg }: { arg: number }) => turnoApi.finalizar(arg),
  )
  return { finalizarTurno: trigger, isLoading: isMutating, error }
}
