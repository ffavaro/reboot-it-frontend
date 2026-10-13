import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, palletApi } from "@/lib/api"
import type { Pallet, CreatePalletPayload, UpdatePalletPayload } from "@/lib/type/pallet"

export function usePallets() {
  const { data, isLoading, error, mutate } = useSWR<Pallet[]>("/pallet", fetcher)
  return { pallets: data ?? [], isLoading, error, mutate }
}

export function useCreatePallet() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/pallet",
    (_key: string, { arg }: { arg: CreatePalletPayload }) => palletApi.create(arg),
  )
  return { createPallet: trigger, isLoading: isMutating, error }
}

export function useUpdatePallet() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/pallet",
    (_key: string, { arg }: { arg: { id: number } & UpdatePalletPayload }) => {
      const { id, ...payload } = arg
      return palletApi.update(id, payload)
    },
  )
  return { updatePallet: trigger, isLoading: isMutating, error }
}

export function useDeletePallet() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/pallet",
    (_key: string, { arg }: { arg: number }) => palletApi.remove(arg),
  )
  return { deletePallet: trigger, isLoading: isMutating, error }
}
