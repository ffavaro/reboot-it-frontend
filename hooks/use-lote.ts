import useSWR from "swr"
import { fetcher, loteApi } from "@/lib/api"
import type { Lote } from "@/lib/type/lote"

export function useLotes() {
  const { data, isLoading, error, mutate } = useSWR<Lote[]>("/lote", fetcher)
  return { lotes: data ?? [], isLoading, error, mutate }
}
