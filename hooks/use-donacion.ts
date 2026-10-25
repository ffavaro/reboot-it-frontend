import useSWR from "swr"
import { donacionApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type { Donacion, DonacionCreada, CreateDonacionPayload, UpdateDonacionPayload, ReporteDonacion, ReporteDonacionQuery } from "@/lib/type/donacion"

// TCreateResult se pasa explícito porque donacionApi.create devuelve DonacionCreada (incluye el turno generado), no solo Donacion
const crud = createCrudHooks<Donacion, CreateDonacionPayload, UpdateDonacionPayload, number, DonacionCreada>("/donacion", donacionApi)

export function useDonaciones() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { donaciones: data, isLoading, error, mutate }
}

export function useDonacionReporte(params: ReporteDonacionQuery) {
  const { data, isLoading, error, mutate } = useSWR<ReporteDonacion[]>(
    ["/donacion/reporte", params],
    () => donacionApi.getReporte(params),
  )
  return { donaciones: data ?? [], isLoading, error, mutate }
}

export function useCreateDonacion() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createDonacion: trigger, isLoading, error }
}

export function useUpdateDonacion() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateDonacion: trigger, isLoading, error }
}

export function useDeleteDonacion() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteDonacion: trigger, isLoading, error }
}
