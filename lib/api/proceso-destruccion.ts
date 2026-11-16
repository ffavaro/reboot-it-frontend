import type {
  ProcesoDestruccion,
  CreateProcesoDestruccionPayload,
  UpdateProcesoDestruccionPayload,
  ReporteProcesoDestruccionQuery,
} from "@/lib/type/proceso-destruccion"
import { request } from "./client"
import { crudApi } from "./crud"

export const procesoDestruccionApi = {
  ...crudApi<ProcesoDestruccion, CreateProcesoDestruccionPayload, UpdateProcesoDestruccionPayload>("/proceso-destruccion"),

  getReporte: (params: ReporteProcesoDestruccionQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<ProcesoDestruccion[]>(`/proceso-destruccion/reporte${qs ? `?${qs}` : ""}`)
  },
}
