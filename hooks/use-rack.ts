import { rackApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Rack, CreateRackPayload, UpdateRackPayload } from "@/lib/type/rack"

const h = crearHooksRecurso<Rack, CreateRackPayload, UpdateRackPayload>("/rack", rackApi)

export function useRacks() { const { data, ...r } = h.useLista(); return { racks: data, ...r } }
export function useCreateRack() { const { trigger, ...r } = h.useCrear(); return { createRack: trigger, ...r } }
export function useUpdateRack() { const { trigger, ...r } = h.useActualizar(); return { updateRack: trigger, ...r } }
export function useDeleteRack() { const { trigger, ...r } = h.useEliminar(); return { deleteRack: trigger, ...r } }
