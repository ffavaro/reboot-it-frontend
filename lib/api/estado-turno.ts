import type { EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload } from "@/lib/type/estado-turno"
import { crudApi } from "./crud"

export const estadoTurnoApi = crudApi<EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload>("/estado-turno")
