import type {
  MedioAlmacenamiento,
  CreateMedioAlmacenamientoPayload,
  UpdateMedioAlmacenamientoPayload,
} from "@/lib/type/medio-almacenamiento"
import { request } from "./client"

export const medioAlmacenamientoApi = {
  getAll: () => request<MedioAlmacenamiento[]>("/medio-almacenamiento"),

  create: (data: CreateMedioAlmacenamientoPayload) =>
    request<MedioAlmacenamiento>("/medio-almacenamiento", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateMedioAlmacenamientoPayload) =>
    request<MedioAlmacenamiento>(`/medio-almacenamiento/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/medio-almacenamiento/${id}`, { method: "DELETE" }),
}
