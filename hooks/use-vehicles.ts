import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { vehiculosApi, tipoVehiculosApi } from "@/lib/api"
import type { Vehiculo, TipoVehiculo, CreateVehiculoPayload, UpdateVehiculoPayload, CreateTipoVehiculoPayload, UpdateTipoVehiculoPayload } from "@/lib/type/vehicle"

const vehiculoCrud = createCrudHooks<Vehiculo, CreateVehiculoPayload, UpdateVehiculoPayload>("/vehiculos", vehiculosApi)
const tipoVehiculoCrud = createCrudHooks<TipoVehiculo, CreateTipoVehiculoPayload, UpdateTipoVehiculoPayload>(
  "/tipo-vehiculo",
  tipoVehiculosApi,
)

export function useVehiculos() {
  const { data, isLoading, error, mutate } = vehiculoCrud.useList()
  return { vehiculos: data, isLoading, error, mutate }
}

export function useTipoVehiculos() {
  const { data, isLoading, error, mutate } = tipoVehiculoCrud.useList()
  return { tipos: data, isLoading, error, mutate }
}

export function useCreateVehiculo() {
  const { trigger, isLoading, error } = vehiculoCrud.useCreate()
  return { createVehiculo: trigger, isLoading, error }
}

export function useUpdateVehiculo() {
  const { trigger, isLoading, error } = vehiculoCrud.useUpdate()
  return { updateVehiculo: trigger, isLoading, error }
}

export function useDeleteVehiculo() {
  const { trigger, isLoading, error } = vehiculoCrud.useDelete()
  return { deleteVehiculo: trigger, isLoading, error }
}

export function useCreateTipoVehiculo() {
  const { trigger, isLoading, error } = tipoVehiculoCrud.useCreate()
  return { createTipo: trigger, isLoading, error }
}

export function useUpdateTipoVehiculo() {
  const { trigger, isLoading, error } = tipoVehiculoCrud.useUpdate()
  return { updateTipo: trigger, isLoading, error }
}

export function useDeleteTipoVehiculo() {
  const { trigger, isLoading, error } = tipoVehiculoCrud.useDelete()
  return { deleteTipo: trigger, isLoading, error }
}
