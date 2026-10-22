import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { permisosApi } from "@/lib/api"
import { getUser } from "@/lib/auth-utils"
import type { GuardarPermisosPayload, MatrizRol, Permisos } from "@/lib/type/permisos"

// La clave incluye al usuario: al cambiar de sesión en la misma pestaña no se reutilizan los permisos del anterior
export function useMisPermisos() {
  const userId = typeof window === "undefined" ? null : getUser()?.id ?? null
  const { data, isLoading, error, mutate } = useSWR<Permisos>(
    userId ? ["/permisos/mias", userId] : null,
    () => permisosApi.mias(),
    { revalidateOnFocus: false },
  )
  return { permisos: data, isLoading, error, mutate }
}

export function useMatrizRol(rolId: number | null) {
  const { data, isLoading, error, mutate } = useSWR<MatrizRol>(
    rolId ? ["/permisos/rol", rolId] : null,
    () => permisosApi.matrizDeRol(rolId as number),
  )
  return { matriz: data, isLoading, error, mutate }
}

export function useGuardarMatriz() {
  const { trigger, isMutating } = useSWRMutation(
    "/permisos/rol",
    (_key: string, { arg }: { arg: { rolId: number } & GuardarPermisosPayload }) => {
      const { rolId, ...payload } = arg
      return permisosApi.guardarMatriz(rolId, payload)
    },
  )
  return { guardarMatriz: trigger, isLoading: isMutating }
}
