import { loteApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Lote, CreateLotePayload, UpdateLotePayload } from "@/lib/type/lote"

const h = crearHooksRecurso<Lote, CreateLotePayload, UpdateLotePayload>("/lote", loteApi)

export function useLotes() { const { data, ...r } = h.useLista(); return { lotes: data, ...r } }
export function useCreateLote() { const { trigger, ...r } = h.useCrear(); return { createLote: trigger, ...r } }
export function useUpdateLote() { const { trigger, ...r } = h.useActualizar(); return { updateLote: trigger, ...r } }
export function useDeleteLote() { const { trigger, ...r } = h.useEliminar(); return { deleteLote: trigger, ...r } }
