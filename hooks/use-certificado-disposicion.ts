import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { certificadoDisposicionApi } from "@/lib/api"
import type {
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload,
} from "@/lib/type/certificado-disposicion"

const crud = createCrudHooks<CertificadoDisposicion, CreateCertificadoDisposicionPayload, UpdateCertificadoDisposicionPayload>(
  "/certificado-disposicion",
  certificadoDisposicionApi,
)

export function useCertificadosDisposicion() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { certificados: data, isLoading, error, mutate }
}

export function useCreateCertificadoDisposicion() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createCertificado: trigger, isLoading, error }
}

export function useUpdateCertificadoDisposicion() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateCertificado: trigger, isLoading, error }
}

export function useDeleteCertificadoDisposicion() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteCertificado: trigger, isLoading, error }
}
