import type { Lote, CreateLotePayload, UpdateLotePayload } from "@/lib/type/lote"
import { crudApi } from "./crud"

export const loteApi = crudApi<Lote, CreateLotePayload, UpdateLotePayload>("/lote")
