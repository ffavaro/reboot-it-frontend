import type { Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"
import { crudApi } from "./crud"

export const empleadosApi = crudApi<Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload>("/empleados")
