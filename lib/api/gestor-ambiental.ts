import type { GestorAmbiental, CreateGestorAmbientalPayload, UpdateGestorAmbientalPayload } from "@/lib/type/gestor-ambiental"
import { crudApi } from "./crud"

export const gestorAmbientalApi = crudApi<
  GestorAmbiental,
  CreateGestorAmbientalPayload,
  UpdateGestorAmbientalPayload
>("/gestor-ambiental")
