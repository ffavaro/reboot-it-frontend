import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, hojaRutaApi, buildQuery } from "@/lib/api"
import type {
  GenerarHojaRutaPayload, HojaRutaDia, HojaRutaDiaQuery, HojaRutaHistorico, HojaRutaHistoricoQuery,
} from "@/lib/type/hoja-ruta"

// enabled=false pausa la consulta (por ejemplo, mientras no se sabe qué transportista es el usuario)
export function useHojasRutaDia(query: HojaRutaDiaQuery, enabled = true) {
  const key = enabled ? `/hojas-ruta/dia${buildQuery({ ...query })}` : null
  const { data, isLoading, error, mutate } = useSWR<HojaRutaDia[]>(key, fetcher)
  return { hojas: data ?? [], isLoading, error, mutate }
}

export function useHojasRutaHistorico(query: HojaRutaHistoricoQuery, enabled = true) {
  const key = enabled ? `/hojas-ruta/historico${buildQuery({ ...query })}` : null
  const { data, isLoading, error, mutate } = useSWR<HojaRutaHistorico[]>(key, fetcher)
  return { hojas: data ?? [], isLoading, error, mutate }
}

export function useGenerarHojaRuta() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/hojas-ruta/generar",
    (_key: string, { arg }: { arg: GenerarHojaRutaPayload }) => hojaRutaApi.generar(arg),
  )
  return { generarHojaRuta: trigger, isLoading: isMutating, error }
}

export function useConfirmarRetiro() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/hojas-ruta/confirmar-retiro",
    (_key: string, { arg }: { arg: number }) => hojaRutaApi.confirmarRetiro(arg),
  )
  return { confirmarRetiro: trigger, isLoading: isMutating, error }
}
