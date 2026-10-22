import type {
  ProcesoDestruccion,
  CreateProcesoDestruccionPayload,
  UpdateProcesoDestruccionPayload,
  ReporteProcesoDestruccionQuery,
} from "@/lib/type/proceso-destruccion"
import { request } from "./client"

export const procesoDestruccionApi = {
  getAll: () => request<ProcesoDestruccion[]>("/proceso-destruccion"),

  getReporte: (params: ReporteProcesoDestruccionQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<ProcesoDestruccion[]>(`/proceso-destruccion/reporte${qs ? `?${qs}` : ""}`)
  },

  create: (data: CreateProcesoDestruccionPayload) =>
    request<ProcesoDestruccion>("/proceso-destruccion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateProcesoDestruccionPayload) =>
    request<ProcesoDestruccion>(`/proceso-destruccion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Cierra el proceso (estado Finalizado): lo hace el Técnico o el Administrativo
  finalizar: (id: number) =>
    request<ProcesoDestruccion>(`/proceso-destruccion/${id}/finalizar`, { method: "PATCH" }),

  remove: (id: number) =>
    request<void>(`/proceso-destruccion/${id}`, { method: "DELETE" }),
}
