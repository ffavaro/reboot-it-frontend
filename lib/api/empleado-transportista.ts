import type {
  EmpleadoTransportista,
  CreateEmpleadoTransportistaPayload,
  UpdateEmpleadoTransportistaPayload,
} from "@/lib/type/empleado-transportista"
import { crudApi } from "./crud"

export const empleadoTransportistaApi = crudApi<
  EmpleadoTransportista,
  CreateEmpleadoTransportistaPayload,
  UpdateEmpleadoTransportistaPayload
>("/empleado-transportista")
