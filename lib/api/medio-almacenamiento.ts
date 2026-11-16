import type {
  MedioAlmacenamiento,
  CreateMedioAlmacenamientoPayload,
  UpdateMedioAlmacenamientoPayload,
} from "@/lib/type/medio-almacenamiento"
import { crudApi } from "./crud"

export const medioAlmacenamientoApi = crudApi<
  MedioAlmacenamiento,
  CreateMedioAlmacenamientoPayload,
  UpdateMedioAlmacenamientoPayload
>("/medio-almacenamiento")
