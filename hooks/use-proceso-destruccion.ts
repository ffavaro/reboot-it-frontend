import { procesoDestruccionApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  ProcesoDestruccion,
  CreateProcesoDestruccionPayload,
  UpdateProcesoDestruccionPayload,
} from "@/lib/type/proceso-destruccion"

const h = crearHooksRecurso<ProcesoDestruccion, CreateProcesoDestruccionPayload, UpdateProcesoDestruccionPayload>(
  "/proceso-destruccion",
  procesoDestruccionApi,
)

export function useProcesosDestruccion() { const { data, ...r } = h.useLista(); return { procesos: data, ...r } }
export function useCreateProcesoDestruccion() { const { trigger, ...r } = h.useCrear(); return { createProceso: trigger, ...r } }
export function useUpdateProcesoDestruccion() { const { trigger, ...r } = h.useActualizar(); return { updateProceso: trigger, ...r } }
export function useDeleteProcesoDestruccion() { const { trigger, ...r } = h.useEliminar(); return { deleteProceso: trigger, ...r } }
