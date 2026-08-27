import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, donacionApi } from "@/lib/api"
import type { Donacion, CreateDonacionPayload, UpdateDonacionPayload, ReporteDonacion, ReporteDonacionQuery } from "@/lib/type/donacion"

export function useDonaciones() {
  const { data, isLoading, error, mutate } = useSWR<Donacion[]>("/donacion", fetcher)
  return { donaciones: data ?? [], isLoading, error, mutate }
}

export function useDonacionReporte(params: ReporteDonacionQuery) {
  const { data, isLoading, error, mutate } = useSWR<ReporteDonacion[]>(
    ["/donacion/reporte", params],
    () => donacionApi.getReporte(params),
  )
  return { donaciones: data ?? [], isLoading, error, mutate }
}

export function useCreateDonacion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/donacion",
    (_key: string, { arg }: { arg: CreateDonacionPayload }) => donacionApi.create(arg),
  )
  return { createDonacion: trigger, isLoading: isMutating, error }
}

export function useUpdateDonacion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/donacion",
    (_key: string, { arg }: { arg: { id: number } & UpdateDonacionPayload }) => {
      const { id, ...payload } = arg
      return donacionApi.update(id, payload)
    },
  )
  return { updateDonacion: trigger, isLoading: isMutating, error }
}

export function useDeleteDonacion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/donacion",
    (_key: string, { arg }: { arg: number }) => donacionApi.remove(arg),
  )
  return { deleteDonacion: trigger, isLoading: isMutating, error }
}
