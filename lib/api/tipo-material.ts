import type { TipoMaterial, CreateTipoMaterialPayload, UpdateTipoMaterialPayload } from "@/lib/type/tipo-material"
import { crudApi } from "./crud"

export const tipoMaterialApi = crudApi<TipoMaterial, CreateTipoMaterialPayload, UpdateTipoMaterialPayload>("/tipo-material")
