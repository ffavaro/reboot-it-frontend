import type { Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"
import { request } from "./client"

export const empleadosApi = {
  getAll: () => request<Empleado[]>("/empleados"),

  create: (data: CreateEmpleadoPayload) =>
    request<Empleado>("/empleados", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateEmpleadoPayload) =>
    request<Empleado>(`/empleados/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/empleados/${id}`, { method: "DELETE" }),
}
