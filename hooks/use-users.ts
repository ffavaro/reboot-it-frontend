import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, usuariosApi, empleadosApi } from "@/lib/api"
import type { Usuario, Empleado, CreateUsuarioPayload, UpdateUsuarioPayload } from "@/lib/type/user"

export function useUsuarios() {
  const { data, isLoading, error, mutate } = useSWR<Usuario[]>("/usuarios", fetcher)
  return { usuarios: data ?? [], isLoading, error, mutate }
}

export function useEmpleados() {
  const { data, isLoading } = useSWR<Empleado[]>("/empleados", fetcher)
  return { empleados: data ?? [], isLoading }
}

export function useUpdateUsuario() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/usuarios",
    (_key: string, { arg }: { arg: { id: string } & UpdateUsuarioPayload }) => {
      const { id, ...payload } = arg
      return usuariosApi.update(id, payload)
    }
  )
  return { updateUsuario: trigger, isLoading: isMutating, error }
}

export function useDeleteUsuario() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/usuarios",
    (_key: string, { arg }: { arg: string }) => usuariosApi.delete(arg)
  )
  return { deleteUsuario: trigger, isLoading: isMutating, error }
}

export function useCreateUsuario() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/usuarios",
    (_key: string, { arg }: { arg: CreateUsuarioPayload }) => usuariosApi.create(arg)
  )
  return { createUsuario: trigger, isLoading: isMutating, error }
}
