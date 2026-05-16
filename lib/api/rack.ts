import type { Rack, CreateRackPayload, UpdateRackPayload } from "@/lib/type/rack"
import { request } from "./client"

export const rackApi = {
  getAll: () => request<Rack[]>("/rack"),

  create: (data: CreateRackPayload) =>
    request<Rack>("/rack", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateRackPayload) =>
    request<Rack>(`/rack/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/rack/${id}`, { method: "DELETE" }),
}
