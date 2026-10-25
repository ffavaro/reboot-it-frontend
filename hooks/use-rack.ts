import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { rackApi } from "@/lib/api"
import type { Rack, CreateRackPayload, UpdateRackPayload } from "@/lib/type/rack"

const crud = createCrudHooks<Rack, CreateRackPayload, UpdateRackPayload>("/rack", rackApi)

export function useRacks() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { racks: data, isLoading, error, mutate }
}

export function useCreateRack() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createRack: trigger, isLoading, error }
}

export function useUpdateRack() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateRack: trigger, isLoading, error }
}

export function useDeleteRack() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteRack: trigger, isLoading, error }
}
