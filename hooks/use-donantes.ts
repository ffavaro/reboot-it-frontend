import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { donantesApi, tipoDonanteApi } from "@/lib/api"
import type {
  Donante,
  TipoDonante,
  CreateDonantePayload,
  UpdateDonantePayload,
  CreateTipoDonantePayload,
  UpdateTipoDonantePayload,
} from "@/lib/type/donante"

const donanteCrud = createCrudHooks<Donante, CreateDonantePayload, UpdateDonantePayload>("/donantes", donantesApi)
const tipoDonanteCrud = createCrudHooks<TipoDonante, CreateTipoDonantePayload, UpdateTipoDonantePayload>(
  "/tipo-donante",
  tipoDonanteApi,
)

export function useDonantes() {
  const { data, isLoading, error, mutate } = donanteCrud.useList()
  return { donantes: data, isLoading, error, mutate }
}

export function useTipoDonantes() {
  const { data, isLoading, error, mutate } = tipoDonanteCrud.useList()
  return { tipos: data, isLoading, error, mutate }
}

export function useCreateDonante() {
  const { trigger, isLoading, error } = donanteCrud.useCreate()
  return { createDonante: trigger, isLoading, error }
}

export function useUpdateDonante() {
  const { trigger, isLoading, error } = donanteCrud.useUpdate()
  return { updateDonante: trigger, isLoading, error }
}

export function useDeleteDonante() {
  const { trigger, isLoading, error } = donanteCrud.useDelete()
  return { deleteDonante: trigger, isLoading, error }
}

export function useCreateTipoDonante() {
  const { trigger, isLoading, error } = tipoDonanteCrud.useCreate()
  return { createTipo: trigger, isLoading, error }
}

export function useUpdateTipoDonante() {
  const { trigger, isLoading, error } = tipoDonanteCrud.useUpdate()
  return { updateTipo: trigger, isLoading, error }
}

export function useDeleteTipoDonante() {
  const { trigger, isLoading, error } = tipoDonanteCrud.useDelete()
  return { deleteTipo: trigger, isLoading, error }
}
