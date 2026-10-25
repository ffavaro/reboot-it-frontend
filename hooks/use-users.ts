import useSWR from "swr"
import { fetcher, usuariosApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type { Usuario, Empleado, CreateUsuarioPayload, UpdateUsuarioPayload } from "@/lib/type/user"

const crud = createCrudHooks<Usuario, CreateUsuarioPayload, UpdateUsuarioPayload, string>("/usuarios", {
  create: usuariosApi.create,
  update: usuariosApi.update,
  remove: usuariosApi.delete,
})

export function useUsuarios() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { usuarios: data, isLoading, error, mutate }
}

export function useEmpleados() {
  const { data, isLoading } = useSWR<Empleado[]>("/empleados", fetcher)
  return { empleados: data ?? [], isLoading }
}

export function useUpdateUsuario() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateUsuario: trigger, isLoading, error }
}

export function useDeleteUsuario() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteUsuario: trigger, isLoading, error }
}

export function useCreateUsuario() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createUsuario: trigger, isLoading, error }
}
