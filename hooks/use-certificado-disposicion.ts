import { certificadoDisposicionApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type {
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload,
} from "@/lib/type/certificado-disposicion"

const h = crearHooksRecurso<
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload
>("/certificado-disposicion", certificadoDisposicionApi)

export function useCertificadosDisposicion() { const { data, ...r } = h.useLista(); return { certificados: data, ...r } }
export function useCreateCertificadoDisposicion() { const { trigger, ...r } = h.useCrear(); return { createCertificado: trigger, ...r } }
export function useUpdateCertificadoDisposicion() { const { trigger, ...r } = h.useActualizar(); return { updateCertificado: trigger, ...r } }
export function useDeleteCertificadoDisposicion() { const { trigger, ...r } = h.useEliminar(); return { deleteCertificado: trigger, ...r } }
