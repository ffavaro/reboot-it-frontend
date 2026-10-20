import type {
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload,
  CertificadoDisposicionDatos,
} from "@/lib/type/certificado-disposicion"
import { request } from "./client"

export const certificadoDisposicionApi = {
  getAll: () => request<CertificadoDisposicion[]>("/certificado-disposicion"),

  // Datos para generar el PDF del certificado
  datos: (id: number) => request<CertificadoDisposicionDatos>(`/certificado-disposicion/${id}/datos`),

  create: (data: CreateCertificadoDisposicionPayload) =>
    request<CertificadoDisposicion>("/certificado-disposicion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateCertificadoDisposicionPayload) =>
    request<CertificadoDisposicion>(`/certificado-disposicion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/certificado-disposicion/${id}`, { method: "DELETE" }),
}
