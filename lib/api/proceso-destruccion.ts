import type {
  ProcesoDestruccion,
  CreateProcesoDestruccionPayload,
  UpdateProcesoDestruccionPayload,
} from "@/lib/type/proceso-destruccion"
import { request } from "./client"

export const procesoDestruccionApi = {
  getAll: () => request<ProcesoDestruccion[]>("/proceso-destruccion"),

  create: (data: CreateProcesoDestruccionPayload) =>
    request<ProcesoDestruccion>("/proceso-destruccion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateProcesoDestruccionPayload) =>
    request<ProcesoDestruccion>(`/proceso-destruccion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/proceso-destruccion/${id}`, { method: "DELETE" }),
}
