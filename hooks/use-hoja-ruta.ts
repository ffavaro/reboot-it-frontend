import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, hojaRutaApi, buildQuery } from "@/lib/api"
import type {
  HojaRutaDia, HojaRutaDiaQuery, HojaRutaHistorico, HojaRutaHistoricoQuery,
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

export function useIniciarHojaRuta() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/hojas-ruta/iniciar",
    (_key: string, { arg }: { arg: number }) => hojaRutaApi.iniciar(arg),
  )
  return { iniciarHojaRuta: trigger, isLoading: isMutating, error }
}

export function useFinalizarHojaRuta() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/hojas-ruta/finalizar",
    (_key: string, { arg }: { arg: { id: number; kmFinal: number } }) => hojaRutaApi.finalizar(arg.id, arg.kmFinal),
  )
  return { finalizarHojaRuta: trigger, isLoading: isMutating, error }
}
