import type {
  ConstanciaRetiro,
  CreateConstanciaRetiroPayload,
  UpdateConstanciaRetiroPayload,
} from "@/lib/type/constancia-retiro"
import type { ConstanciaRetiroDatos } from "@/lib/type/hoja-ruta"
import { request } from "./client"

export const constanciaRetiroApi = {
  getAll: () => request<ConstanciaRetiro[]>("/constancia-retiro"),

  // Datos de la constancia para mostrarla y descargarla en PDF
  datos: (id: number) => request<ConstanciaRetiroDatos>(`/constancia-retiro/${id}/datos`),

  create: (data: CreateConstanciaRetiroPayload) =>
    request<ConstanciaRetiro>("/constancia-retiro", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateConstanciaRetiroPayload) =>
    request<ConstanciaRetiro>(`/constancia-retiro/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/constancia-retiro/${id}`, { method: "DELETE" }),
}
