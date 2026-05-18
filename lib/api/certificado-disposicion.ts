import type {
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload,
} from "@/lib/type/certificado-disposicion"
import { request } from "./client"

export const certificadoDisposicionApi = {
  getAll: () => request<CertificadoDisposicion[]>("/certificado-disposicion"),

  create: (data: CreateCertificadoDisposicionPayload) =>
    request<CertificadoDisposicion>("/certificado-disposicion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateCertificadoDisposicionPayload) =>
    request<CertificadoDisposicion>(`/certificado-disposicion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/certificado-disposicion/${id}`, { method: "DELETE" }),
}
