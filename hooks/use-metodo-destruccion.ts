import { metodoDestruccionApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  CreateMetodoDestruccionPayload,
  UpdateMetodoDestruccionPayload,
} from "@/lib/api/metodo-destruccion"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"

const h = crearHooksRecurso<MetodoDestruccion, CreateMetodoDestruccionPayload, UpdateMetodoDestruccionPayload>(
  "/metodo-destruccion",
  metodoDestruccionApi,
)

export function useMetodosDestruccion() { const { data, ...r } = h.useLista(); return { metodos: data, ...r } }
export function useCreateMetodoDestruccion() { const { trigger, ...r } = h.useCrear(); return { createMetodo: trigger, ...r } }
export function useUpdateMetodoDestruccion() { const { trigger, ...r } = h.useActualizar(); return { updateMetodo: trigger, ...r } }
export function useDeleteMetodoDestruccion() { const { trigger, ...r } = h.useEliminar(); return { deleteMetodo: trigger, ...r } }
