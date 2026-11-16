import type { Tipo, CreateTipoPayload, UpdateTipoPayload } from "@/lib/type/tipo"
import { crudApi } from "./crud"

export const tipoApi = crudApi<Tipo, CreateTipoPayload, UpdateTipoPayload>("/tipo")
