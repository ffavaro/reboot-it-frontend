import type { Donacion, CreateDonacionPayload, UpdateDonacionPayload } from "@/lib/type/donacion"
import { request } from "./client"

export const donacionApi = {
  getAll: () => request<Donacion[]>("/donacion"),

  create: (data: CreateDonacionPayload) =>
    request<Donacion>("/donacion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateDonacionPayload) =>
    request<Donacion>(`/donacion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/donacion/${id}`, { method: "DELETE" }),
}