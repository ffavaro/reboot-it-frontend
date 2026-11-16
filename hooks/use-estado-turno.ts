import { estadoTurnoApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload } from "@/lib/type/estado-turno"

const h = crearHooksRecurso<EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload>("/estado-turno", estadoTurnoApi)

export function useEstadosTurno() { const { data, ...r } = h.useLista(); return { estadosTurno: data, ...r } }
export function useCreateEstadoTurno() { const { trigger, ...r } = h.useCrear(); return { createEstadoTurno: trigger, ...r } }
export function useUpdateEstadoTurno() { const { trigger, ...r } = h.useActualizar(); return { updateEstadoTurno: trigger, ...r } }
export function useDeleteEstadoTurno() { const { trigger, ...r } = h.useEliminar(); return { deleteEstadoTurno: trigger, ...r } }
