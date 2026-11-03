import useSWR from "swr"
import { auditoriaApi } from "@/lib/api/auditoria"
import type { ConsultaAuditoria } from "@/lib/type/auditoria"

export function useEventosAuditoria(consulta: ConsultaAuditoria | null) {
  const { data, isLoading, error } = useSWR(
    consulta ? ["/auditoria", consulta] : null,
    ([, c]) => auditoriaApi.getPage(c),
    { keepPreviousData: true },
  )
  return { pagina: data, isLoading, error }
}

export function useAccionesAuditoria(habilitado: boolean) {
  const { data } = useSWR(habilitado ? "/auditoria/acciones" : null, auditoriaApi.getActions)
  return { acciones: data ?? [] }
}
