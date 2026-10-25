import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { palletApi } from "@/lib/api"
import type { Pallet, CreatePalletPayload, UpdatePalletPayload } from "@/lib/type/pallet"

const crud = createCrudHooks<Pallet, CreatePalletPayload, UpdatePalletPayload>("/pallet", palletApi)

export function usePallets() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { pallets: data, isLoading, error, mutate }
}

export function useCreatePallet() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createPallet: trigger, isLoading, error }
}

export function useUpdatePallet() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updatePallet: trigger, isLoading, error }
}

export function useDeletePallet() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deletePallet: trigger, isLoading, error }
}
