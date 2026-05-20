import useSWR from "swr"
import { fetcher } from "@/lib/api"
import type { EstadoDonacion } from "@/lib/type/donacion"

export function useEstadosDonacion() {
  const { data, isLoading } = useSWR<EstadoDonacion[]>("/estado-donacion", fetcher)
  return { estadosDonacion: data ?? [], isLoading }
}
