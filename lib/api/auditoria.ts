import type { AuditoriaPagina, AuditoriaQuery } from "@/lib/type/auditoria"
import { request } from "./client"

export const auditoriaApi = {
  listar: (params: AuditoriaQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<AuditoriaPagina>(`/auditoria${qs ? `?${qs}` : ""}`)
  },
}
