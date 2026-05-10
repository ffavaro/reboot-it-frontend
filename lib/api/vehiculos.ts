import type { Vehiculo, CreateVehiculoPayload, UpdateVehiculoPayload } from "@/lib/type/vehicle"
import { request } from "./client"

export const vehiculosApi = {
  getAll: () => request<Vehiculo[]>("/vehiculos"),

  create: (data: CreateVehiculoPayload) =>
    request<Vehiculo>("/vehiculos", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateVehiculoPayload) =>
    request<Vehiculo>(`/vehiculos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/vehiculos/${id}`, { method: "DELETE" }),
}
