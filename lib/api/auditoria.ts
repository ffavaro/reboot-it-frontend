import type { ConsultaAuditoria, PaginaAuditoria } from "@/lib/type/auditoria"
import { request } from "./client"

function aQuery(consulta: ConsultaAuditoria) {
  const pares = Object.entries(consulta).filter(([, v]) => v !== undefined && v !== "")
  return new URLSearchParams(pares.map(([k, v]) => [k, String(v)])).toString()
}

export const auditoriaApi = {
  getPage: (consulta: ConsultaAuditoria) => request<PaginaAuditoria>(`/auditoria?${aQuery(consulta)}`),
  getActions: () => request<string[]>("/auditoria/acciones"),
}
