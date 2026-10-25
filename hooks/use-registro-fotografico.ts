import useSWR from "swr"
import { fetcher, registroFotograficoApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type {
  RegistroFotografico,
  CreateRegistroFotograficoPayload,
  UpdateRegistroFotograficoPayload,
} from "@/lib/type/registro-fotografico"

const crud = createCrudHooks<RegistroFotografico, CreateRegistroFotograficoPayload, UpdateRegistroFotograficoPayload>(
  "/registro-fotografico",
  registroFotograficoApi,
)

export function useRegistrosFotograficos() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { registros: data, isLoading, error, mutate }
}

export function useCreateRegistroFotografico() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createRegistro: trigger, isLoading, error }
}

export function useUpdateRegistroFotografico() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateRegistro: trigger, isLoading, error }
}

export function useDeleteRegistroFotografico() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteRegistro: trigger, isLoading, error }
}

export function useRegistrosByTurno(turnoId: number | null) {
  const { data, isLoading, mutate } = useSWR<RegistroFotografico[]>(
    turnoId ? `/registro-fotografico/by-turno/${turnoId}` : null,
    fetcher,
  )
  return { fotos: data ?? [], isLoading, mutate }
}
