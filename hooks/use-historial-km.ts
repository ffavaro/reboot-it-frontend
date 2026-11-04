import useSWR from "swr"
import { fetcher } from "@/lib/api"
import type { RangoFechas, RecorridoKm } from "@/lib/type/historial-km"

export function useRecorridosDeVehiculo(vehiculoId: number | null, { desde, hasta }: RangoFechas) {
  const filtros = new URLSearchParams()
  if (desde) filtros.set("fechaDesde", desde)
  if (hasta) filtros.set("fechaHasta", hasta)
  const consulta = filtros.toString()
  const sufijo = consulta ? `?${consulta}` : ""
  const clave = vehiculoId ? `/historial-km-vehiculo/vehiculo/${vehiculoId}${sufijo}` : null

  const { data, error, isLoading } = useSWR<RecorridoKm[]>(clave, fetcher)
  return { recorridos: data ?? [], error, cargando: isLoading }
}
