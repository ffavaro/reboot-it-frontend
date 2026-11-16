import { tipoMaterialApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { TipoMaterial, CreateTipoMaterialPayload, UpdateTipoMaterialPayload } from "@/lib/type/tipo-material"

const h = crearHooksRecurso<TipoMaterial, CreateTipoMaterialPayload, UpdateTipoMaterialPayload>("/tipo-material", tipoMaterialApi)

export function useTipoMateriales() { const { data, ...r } = h.useLista(); return { tipoMateriales: data, ...r } }
export function useCreateTipoMaterial() { const { trigger, ...r } = h.useCrear(); return { createTipoMaterial: trigger, ...r } }
export function useUpdateTipoMaterial() { const { trigger, ...r } = h.useActualizar(); return { updateTipoMaterial: trigger, ...r } }
export function useDeleteTipoMaterial() { const { trigger, ...r } = h.useEliminar(); return { deleteTipoMaterial: trigger, ...r } }
