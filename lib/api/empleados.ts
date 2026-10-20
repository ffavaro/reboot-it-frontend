import type { Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"

export type EstadoEmpleados = "activos" | "inactivos" | "todos"
import { request } from "./client"

export const empleadosApi = {
  getAll: (estado: EstadoEmpleados = "activos") =>
    request<Empleado[]>(estado === "activos" ? "/empleados" : `/empleados?estado=${estado}`),

  create: (data: CreateEmpleadoPayload) =>
    request<Empleado>("/empleados", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateEmpleadoPayload) =>
    request<Empleado>(`/empleados/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // "Desactivar": el empleado y su usuario quedan inhabilitados, sin borrar sus datos
  remove: (id: number) =>
    request<void>(`/empleados/${id}`, { method: "DELETE" }),

  reactivar: (id: number) =>
    request<Empleado>(`/empleados/${id}/reactivar`, { method: "PATCH" }),
}
