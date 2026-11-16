import { tipoApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Tipo, CreateTipoPayload, UpdateTipoPayload } from "@/lib/type/tipo"

const h = crearHooksRecurso<Tipo, CreateTipoPayload, UpdateTipoPayload>("/tipo", tipoApi)

export function useTipos() { const { data, ...r } = h.useLista(); return { tipos: data, ...r } }
export function useCreateTipo() { const { trigger, ...r } = h.useCrear(); return { createTipo: trigger, ...r } }
export function useUpdateTipo() { const { trigger, ...r } = h.useActualizar(); return { updateTipo: trigger, ...r } }
export function useDeleteTipo() { const { trigger, ...r } = h.useEliminar(); return { deleteTipo: trigger, ...r } }
