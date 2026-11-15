import { marcaApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Marca, CreateMarcaPayload, UpdateMarcaPayload } from "@/lib/type/marca"

const h = crearHooksRecurso<Marca, CreateMarcaPayload, UpdateMarcaPayload>("/marca", marcaApi)

export function useMarcas() { const { data, ...r } = h.useLista(); return { marcas: data, ...r } }
export function useCreateMarca() { const { trigger, ...r } = h.useCrear(); return { createMarca: trigger, ...r } }
export function useUpdateMarca() { const { trigger, ...r } = h.useActualizar(); return { updateMarca: trigger, ...r } }
export function useDeleteMarca() { const { trigger, ...r } = h.useEliminar(); return { deleteMarca: trigger, ...r } }
