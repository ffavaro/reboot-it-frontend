import type { Pallet, CreatePalletPayload, UpdatePalletPayload } from "@/lib/type/pallet"
import { request } from "./client"

export const palletApi = {
  getAll: () => request<Pallet[]>("/pallet"),

  create: (data: CreatePalletPayload) =>
    request<Pallet>("/pallet", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdatePalletPayload) =>
    request<Pallet>(`/pallet/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/pallet/${id}`, { method: "DELETE" }),
}
