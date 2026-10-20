import useSWR from "swr"
import { auditoriaApi } from "@/lib/api"
import type { AuditoriaPagina, AuditoriaQuery } from "@/lib/type/auditoria"

export function useAuditoria(params: AuditoriaQuery) {
  const { data, isLoading, error, mutate } = useSWR<AuditoriaPagina>(
    ["/auditoria", params],
    () => auditoriaApi.listar(params),
    { keepPreviousData: true },
  )
  return { pagina: data, isLoading, error, mutate }
}
