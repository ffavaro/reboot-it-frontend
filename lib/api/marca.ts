import type { Marca, CreateMarcaPayload, UpdateMarcaPayload } from "@/lib/type/marca"
import { crudApi } from "./crud"

export const marcaApi = crudApi<Marca, CreateMarcaPayload, UpdateMarcaPayload>("/marca")
