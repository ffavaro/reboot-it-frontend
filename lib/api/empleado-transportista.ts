import type {
  EmpleadoTransportista,
  CreateEmpleadoTransportistaPayload,
  UpdateEmpleadoTransportistaPayload,
} from "@/lib/type/empleado-transportista"
import { request } from "./client"

export const empleadoTransportistaApi = {
  getAll: () => request<EmpleadoTransportista[]>("/empleado-transportista"),

  create: (data: CreateEmpleadoTransportistaPayload) =>
    request<EmpleadoTransportista>("/empleado-transportista", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateEmpleadoTransportistaPayload) =>
    request<EmpleadoTransportista>(`/empleado-transportista/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/empleado-transportista/${id}`, { method: "DELETE" }),
}