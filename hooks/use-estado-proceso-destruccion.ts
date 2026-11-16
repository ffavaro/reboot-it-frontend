import { estadoProcesoDestruccionApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  CreateEstadoProcesoDestruccionPayload,
  UpdateEstadoProcesoDestruccionPayload,
} from "@/lib/api/estado-proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"

const h = crearHooksRecurso<
  EstadoProcesoDestruccion,
  CreateEstadoProcesoDestruccionPayload,
  UpdateEstadoProcesoDestruccionPayload
>("/estado-proceso-destruccion", estadoProcesoDestruccionApi)

export function useEstadosProcesoDestruccion() { const { data, ...r } = h.useLista(); return { estados: data, ...r } }
export function useCreateEstadoProcesoDestruccion() { const { trigger, ...r } = h.useCrear(); return { createEstado: trigger, ...r } }
export function useUpdateEstadoProcesoDestruccion() { const { trigger, ...r } = h.useActualizar(); return { updateEstado: trigger, ...r } }
export function useDeleteEstadoProcesoDestruccion() { const { trigger, ...r } = h.useEliminar(); return { deleteEstado: trigger, ...r } }
