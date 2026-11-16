import { constanciaRetiroApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  ConstanciaRetiro,
  CreateConstanciaRetiroPayload,
  UpdateConstanciaRetiroPayload,
} from "@/lib/type/constancia-retiro"

const h = crearHooksRecurso<ConstanciaRetiro, CreateConstanciaRetiroPayload, UpdateConstanciaRetiroPayload>(
  "/constancia-retiro",
  constanciaRetiroApi,
)

export function useConstanciasRetiro() { const { data, ...r } = h.useLista(); return { constancias: data, ...r } }
export function useCreateConstanciaRetiro() { const { trigger, ...r } = h.useCrear(); return { createConstancia: trigger, ...r } }
export function useUpdateConstanciaRetiro() { const { trigger, ...r } = h.useActualizar(); return { updateConstancia: trigger, ...r } }
export function useDeleteConstanciaRetiro() { const { trigger, ...r } = h.useEliminar(); return { deleteConstancia: trigger, ...r } }
