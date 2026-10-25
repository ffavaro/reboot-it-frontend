import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { estadoTurnoApi } from "@/lib/api"
import type { EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload } from "@/lib/type/estado-turno"

const crud = createCrudHooks<EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload>(
  "/estado-turno",
  estadoTurnoApi,
)

export function useEstadosTurno() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { estadosTurno: data, isLoading, error, mutate }
}

export function useCreateEstadoTurno() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createEstadoTurno: trigger, isLoading, error }
}

export function useUpdateEstadoTurno() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateEstadoTurno: trigger, isLoading, error }
}

export function useDeleteEstadoTurno() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteEstadoTurno: trigger, isLoading, error }
}
