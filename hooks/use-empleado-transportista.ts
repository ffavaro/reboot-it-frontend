import { empleadoTransportistaApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  EmpleadoTransportista,
  CreateEmpleadoTransportistaPayload,
  UpdateEmpleadoTransportistaPayload,
} from "@/lib/type/empleado-transportista"

const h = crearHooksRecurso<
  EmpleadoTransportista,
  CreateEmpleadoTransportistaPayload,
  UpdateEmpleadoTransportistaPayload
>("/empleado-transportista", empleadoTransportistaApi)

export function useEmpleadosTransportistas() { const { data, ...r } = h.useLista(); return { transportistas: data, ...r } }
export function useCreateEmpleadoTransportista() { const { trigger, ...r } = h.useCrear(); return { createTransportista: trigger, ...r } }
export function useUpdateEmpleadoTransportista() { const { trigger, ...r } = h.useActualizar(); return { updateTransportista: trigger, ...r } }
export function useDeleteEmpleadoTransportista() { const { trigger, ...r } = h.useEliminar(); return { deleteTransportista: trigger, ...r } }
