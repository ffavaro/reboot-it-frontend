import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher } from "@/lib/api"

// TCreateResult/TUpdateResult quedan abiertos (no atados a T) porque algún endpoint devuelve
// un tipo más específico al crear/actualizar (ej. donacionApi.create devuelve DonacionCreada,
// que extiende Donacion agregando el turno generado); se infieren solos a partir de `ops`.
type CrudOps<TCreate, TUpdate, TId, TCreateResult, TUpdateResult> = {
  create: (data: TCreate) => Promise<TCreateResult>
  update: (id: TId, data: TUpdate) => Promise<TUpdateResult>
  remove: (id: TId) => Promise<void>
}

/**
 * Hooks CRUD (listar + crear + actualizar + borrar) sobre un endpoint REST estándar, vía SWR.
 * Cada hooks/use-X.ts llama a esta factory una vez y le pone a cada hook los nombres de campo
 * (ej. `marcas`, `createMarca`) que el resto de la app ya espera, para no tocar los call sites.
 */
export function createCrudHooks<T, TCreate, TUpdate, TId = number, TCreateResult = T, TUpdateResult = T>(
  path: string,
  ops: CrudOps<TCreate, TUpdate, TId, TCreateResult, TUpdateResult>,
) {
  function useList(habilitado = true) {
    const { data, isLoading, error, mutate } = useSWR<T[]>(habilitado ? path : null, fetcher)
    return { data: data ?? [], isLoading, error, mutate }
  }

  function useCreate() {
    const { trigger, isMutating, error } = useSWRMutation(
      path,
      (_key: string, { arg }: { arg: TCreate }) => ops.create(arg),
    )
    return { trigger, isLoading: isMutating, error }
  }

  function useUpdate() {
    const { trigger, isMutating, error } = useSWRMutation(
      path,
      (_key: string, { arg }: { arg: { id: TId } & TUpdate }) => {
        const { id, ...payload } = arg
        return ops.update(id, payload as TUpdate)
      },
    )
    return { trigger, isLoading: isMutating, error }
  }

  function useDelete() {
    const { trigger, isMutating, error } = useSWRMutation(
      path,
      (_key: string, { arg }: { arg: TId }) => ops.remove(arg),
    )
    return { trigger, isLoading: isMutating, error }
  }

  return { useList, useCreate, useUpdate, useDelete }
}
