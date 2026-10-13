import type { Retiro, CreateRetiroPayload, UpdateRetiroPayload } from "@/lib/type/retiro"
import { request } from "./client"

export const retiroApi = {
  getAll: () => request<Retiro[]>("/retiro"),

  create: (data: CreateRetiroPayload) =>
    request<Retiro>("/retiro", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateRetiroPayload) =>
    request<Retiro>(`/retiro/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/retiro/${id}`, { method: "DELETE" }),
}
