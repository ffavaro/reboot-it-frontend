import { retiroApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Retiro, CreateRetiroPayload, UpdateRetiroPayload } from "@/lib/type/retiro"

const h = crearHooksRecurso<Retiro, CreateRetiroPayload, UpdateRetiroPayload>("/retiro", retiroApi)

export function useRetiros() { const { data, ...r } = h.useLista(); return { retiros: data, ...r } }
export function useCreateRetiro() { const { trigger, ...r } = h.useCrear(); return { createRetiro: trigger, ...r } }
export function useUpdateRetiro() { const { trigger, ...r } = h.useActualizar(); return { updateRetiro: trigger, ...r } }
export function useDeleteRetiro() { const { trigger, ...r } = h.useEliminar(); return { deleteRetiro: trigger, ...r } }
