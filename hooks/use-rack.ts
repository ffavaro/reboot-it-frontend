import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, rackApi } from "@/lib/api"
import type { Rack, CreateRackPayload, UpdateRackPayload } from "@/lib/type/rack"

export function useRacks() {
  const { data, isLoading, error, mutate } = useSWR<Rack[]>("/rack", fetcher)
  return { racks: data ?? [], isLoading, error, mutate }
}

export function useCreateRack() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/rack",
    (_key: string, { arg }: { arg: CreateRackPayload }) => rackApi.create(arg),
  )
  return { createRack: trigger, isLoading: isMutating, error }
}

export function useUpdateRack() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/rack",
    (_key: string, { arg }: { arg: { id: number } & UpdateRackPayload }) => {
      const { id, ...payload } = arg
      return rackApi.update(id, payload)
    },
  )
  return { updateRack: trigger, isLoading: isMutating, error }
}

export function useDeleteRack() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/rack",
    (_key: string, { arg }: { arg: number }) => rackApi.remove(arg),
  )
  return { deleteRack: trigger, isLoading: isMutating, error }
}
