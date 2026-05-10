import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, vehiculosApi, tipoVehiculosApi } from "@/lib/api"
import type { Vehiculo, TipoVehiculo, CreateVehiculoPayload, UpdateVehiculoPayload, CreateTipoVehiculoPayload, UpdateTipoVehiculoPayload } from "@/lib/type/vehicle"

export function useVehiculos() {
  const { data, isLoading, error, mutate } = useSWR<Vehiculo[]>("/vehiculos", fetcher)
  return { vehiculos: data ?? [], isLoading, error, mutate }
}

export function useTipoVehiculos() {
  const { data, isLoading, error, mutate } = useSWR<TipoVehiculo[]>("/tipo-vehiculo", fetcher)
  return { tipos: data ?? [], isLoading, error, mutate }
}

export function useCreateVehiculo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/vehiculos",
    (_key: string, { arg }: { arg: CreateVehiculoPayload }) => vehiculosApi.create(arg),
  )
  return { createVehiculo: trigger, isLoading: isMutating, error }
}

export function useUpdateVehiculo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/vehiculos",
    (_key: string, { arg }: { arg: { id: number } & UpdateVehiculoPayload }) => {
      const { id, ...payload } = arg
      return vehiculosApi.update(id, payload)
    },
  )
  return { updateVehiculo: trigger, isLoading: isMutating, error }
}

export function useDeleteVehiculo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/vehiculos",
    (_key: string, { arg }: { arg: number }) => vehiculosApi.remove(arg),
  )
  return { deleteVehiculo: trigger, isLoading: isMutating, error }
}

export function useCreateTipoVehiculo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-vehiculo",
    (_key: string, { arg }: { arg: CreateTipoVehiculoPayload }) => tipoVehiculosApi.create(arg),
  )
  return { createTipo: trigger, isLoading: isMutating, error }
}

export function useUpdateTipoVehiculo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-vehiculo",
    (_key: string, { arg }: { arg: { id: number } & UpdateTipoVehiculoPayload }) => {
      const { id, ...payload } = arg
      return tipoVehiculosApi.update(id, payload)
    },
  )
  return { updateTipo: trigger, isLoading: isMutating, error }
}

export function useDeleteTipoVehiculo() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/tipo-vehiculo",
    (_key: string, { arg }: { arg: number }) => tipoVehiculosApi.remove(arg),
  )
  return { deleteTipo: trigger, isLoading: isMutating, error }
}
