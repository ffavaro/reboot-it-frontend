import { permisosApi } from "@/lib/api/permisos"
import { getToken } from "@/lib/auth-utils"
import { pantallaDeRuta } from "@/lib/type/pantallas"
import { Accion, PermisoPantalla, PermisoAGuardar } from "@/lib/type/permisos"
import { usePathname } from "next/navigation"
import { useSyncExternalStore } from "react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"

const sinSuscripcion = () => () => { }
const tokenEnServidor = () => null

export const useMisPermisos = () => {
    const token = useSyncExternalStore(sinSuscripcion, getToken, tokenEnServidor);
    const { data, error, isLoading, mutate } = useSWR(token ? ["/permisos/mias", token] : null, () => permisosApi.mios(), {
        revalidateOnFocus: false,
    })
    return { permisos: data, error, cargando: isLoading || (!!token && !data && !error), recargar: mutate }
}

const TODO_PERMITIDO: PermisoPantalla = { ver: true, crear: true, editar: true, baja: true, alcance : 'TODOS'}
const NADa_PERMITIDO: PermisoPantalla = { ver: false, crear: false, editar: false, baja: false, alcance : 'TODOS'}

export function usePermisosDePantalla():PermisoPantalla  {
 const pathname = usePathname();
 const { permisos } = useMisPermisos()
 const clave = pantallaDeRuta(pathname);

 if (clave ===null) return TODO_PERMITIDO;
 if (!permisos) return NADa_PERMITIDO;
 return permisos[clave] ?? NADa_PERMITIDO
}

export function usePuede(accion: Accion): boolean {
    return usePermisosDePantalla()[accion];
}

export function useMatrizDeRol(rolId: number | null) {
  const { data, error, isLoading, mutate } = useSWR(rolId ? ["/permisos/rol", rolId] : null, () =>
    permisosApi.matrizDeRol(rolId as number),
  )
  return { matriz: data, error, cargando: isLoading, recargar: mutate }
}

export function useGuardarMatriz() {
  const { trigger, isMutating } = useSWRMutation(
    "/permisos/rol",
    (_clave: string, { arg }: { arg: { rolId: number; permisos: PermisoAGuardar[] } }) =>
      permisosApi.guardarMatriz(arg.rolId, arg.permisos),
  )
  return { guardar: trigger, guardando: isMutating }
}
