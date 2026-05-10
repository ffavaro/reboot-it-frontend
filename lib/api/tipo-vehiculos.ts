import type { TipoVehiculo, CreateTipoVehiculoPayload, UpdateTipoVehiculoPayload } from "@/lib/type/vehicle"
import { request } from "./client"

export const tipoVehiculosApi = {
  getAll: () => request<TipoVehiculo[]>("/tipo-vehiculo"),

  create: (data: CreateTipoVehiculoPayload) =>
    request<TipoVehiculo>("/tipo-vehiculo", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateTipoVehiculoPayload) =>
    request<TipoVehiculo>(`/tipo-vehiculo/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/tipo-vehiculo/${id}`, { method: "DELETE" }),
}
