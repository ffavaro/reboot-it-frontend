import { modeloApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Modelo, CreateModeloPayload, UpdateModeloPayload } from "@/lib/type/modelo"

const h = crearHooksRecurso<Modelo, CreateModeloPayload, UpdateModeloPayload>("/modelo", modeloApi)

export function useModelos() { const { data, ...r } = h.useLista(); return { modelos: data, ...r } }
export function useCreateModelo() { const { trigger, ...r } = h.useCrear(); return { createModelo: trigger, ...r } }
export function useUpdateModelo() { const { trigger, ...r } = h.useActualizar(); return { updateModelo: trigger, ...r } }
export function useDeleteModelo() { const { trigger, ...r } = h.useEliminar(); return { deleteModelo: trigger, ...r } }
