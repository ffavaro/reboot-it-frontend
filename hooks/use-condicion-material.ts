import { condicionMaterialApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  CondicionMaterial,
  CreateCondicionMaterialPayload,
  UpdateCondicionMaterialPayload,
} from "@/lib/type/condicion-material"

const h = crearHooksRecurso<CondicionMaterial, CreateCondicionMaterialPayload, UpdateCondicionMaterialPayload>(
  "/condicion-material",
  condicionMaterialApi,
)

export function useCondicionesMaterial() { const { data, ...r } = h.useLista(); return { condiciones: data, ...r } }
export function useCreateCondicionMaterial() { const { trigger, ...r } = h.useCrear(); return { createCondicion: trigger, ...r } }
export function useUpdateCondicionMaterial() { const { trigger, ...r } = h.useActualizar(); return { updateCondicion: trigger, ...r } }
export function useDeleteCondicionMaterial() { const { trigger, ...r } = h.useEliminar(); return { deleteCondicion: trigger, ...r } }
