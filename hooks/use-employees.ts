import useSWR from "swr"
import { fetcher, empleadosApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Empleado, Rol, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"

const h = crearHooksRecurso<Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload>("/empleados", empleadosApi)

export function useEmpleadosFull() { const { data, ...r } = h.useLista(); return { empleados: data, ...r } }

export function useRoles() {
  const { data, isLoading } = useSWR<Rol[]>("/roles", fetcher)
  return { roles: data ?? [], isLoading }
}

export function useCreateEmpleado() { const { trigger, ...r } = h.useCrear(); return { createEmpleado: trigger, ...r } }
export function useUpdateEmpleado() { const { trigger, ...r } = h.useActualizar(); return { updateEmpleado: trigger, ...r } }
export function useDeleteEmpleado() { const { trigger, ...r } = h.useEliminar(); return { deleteEmpleado: trigger, ...r } }
