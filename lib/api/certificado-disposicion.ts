import type {
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload,
  DatosCertificadoDisposicion,
} from "@/lib/type/certificado-disposicion"
import { request } from "./client"
import { crudApi } from "./crud"

export const certificadoDisposicionApi = {
  ...crudApi<CertificadoDisposicion, CreateCertificadoDisposicionPayload, UpdateCertificadoDisposicionPayload>(
    "/certificado-disposicion",
  ),

  getDatosDocumento: (id: number) =>
    request<DatosCertificadoDisposicion>(`/certificado-disposicion/${id}/datos`),
}
