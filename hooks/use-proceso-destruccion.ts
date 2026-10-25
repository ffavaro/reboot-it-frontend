import useSWRMutation from "swr/mutation"
import { procesoDestruccionApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type {
  ProcesoDestruccion,
  CreateProcesoDestruccionPayload,
  UpdateProcesoDestruccionPayload,
} from "@/lib/type/proceso-destruccion"

const crud = createCrudHooks<ProcesoDestruccion, CreateProcesoDestruccionPayload, UpdateProcesoDestruccionPayload>(
  "/proceso-destruccion",
  procesoDestruccionApi,
)

export function useProcesosDestruccion() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { procesos: data, isLoading, error, mutate }
}

export function useCreateProcesoDestruccion() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createProceso: trigger, isLoading, error }
}

export function useUpdateProcesoDestruccion() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateProceso: trigger, isLoading, error }
}

export function useFinalizarProcesoDestruccion() {
  const { trigger, isMutating } = useSWRMutation(
    "/proceso-destruccion",
    (_key: string, { arg }: { arg: number }) => procesoDestruccionApi.finalizar(arg),
  )
  return { finalizarProceso: trigger, isLoading: isMutating }
}

export function useDeleteProcesoDestruccion() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteProceso: trigger, isLoading, error }
}
