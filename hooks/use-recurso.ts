import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher } from "@/lib/api/client"
import type { CrudApi, IdRecurso } from "@/lib/api/crud"

export function crearHooksRecurso<T, C, U extends object, I extends IdRecurso = number>(
  ruta: string,
  api: CrudApi<T, C, U, I>,
) {
  return {
    useLista() {
      const { data, isLoading, error, mutate } = useSWR<T[]>(ruta, fetcher)
      return { data: data ?? [], isLoading, error, mutate }
    },
    useCrear() {
      const { trigger, isMutating, error } = useSWRMutation(
        ruta,
        (_key: string, { arg }: { arg: C }) => api.create(arg),
      )
      return { trigger, isLoading: isMutating, error }
    },
    useActualizar() {
      const { trigger, isMutating, error } = useSWRMutation(
        ruta,
        (_key: string, { arg }: { arg: { id: I } & U }) => {
          const { id, ...payload } = arg
          return api.update(id, payload as unknown as U)
        },
      )
      return { trigger, isLoading: isMutating, error }
    },
    useEliminar() {
      const { trigger, isMutating, error } = useSWRMutation(
        ruta,
        (_key: string, { arg }: { arg: I }) => api.remove(arg),
      )
      return { trigger, isLoading: isMutating, error }
    },
  }
}
