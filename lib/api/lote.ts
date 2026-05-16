import type { Lote } from "@/lib/type/lote"
import { request } from "./client"

export const loteApi = {
  getAll: () => request<Lote[]>("/lote"),
}
