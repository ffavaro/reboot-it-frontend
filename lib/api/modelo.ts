import type { Modelo, CreateModeloPayload, UpdateModeloPayload } from "@/lib/type/modelo"
import { request } from "./client"
import { crudApi } from "./crud"

export const modeloApi = {
  ...crudApi<Modelo, CreateModeloPayload, UpdateModeloPayload>("/modelo"),

  getByMarca: (marcaId: number) => request<Modelo[]>(`/modelo?marcaId=${marcaId}`),
}
