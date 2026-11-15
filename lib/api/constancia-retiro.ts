import type {
  ConstanciaRetiro,
  CreateConstanciaRetiroPayload,
  UpdateConstanciaRetiroPayload,
  DatosConstanciaRetiro,
} from "@/lib/type/constancia-retiro"
import { request } from "./client"
import { crudApi } from "./crud"

export const constanciaRetiroApi = {
  ...crudApi<ConstanciaRetiro, CreateConstanciaRetiroPayload, UpdateConstanciaRetiroPayload>("/constancia-retiro"),

  getDatosDocumento: (id: number) =>
    request<DatosConstanciaRetiro>(`/constancia-retiro/${id}/datos`),
}
