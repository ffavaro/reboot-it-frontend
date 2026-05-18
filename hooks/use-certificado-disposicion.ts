import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, certificadoDisposicionApi } from "@/lib/api"
import type {
  CertificadoDisposicion,
  CreateCertificadoDisposicionPayload,
  UpdateCertificadoDisposicionPayload,
} from "@/lib/type/certificado-disposicion"

export function useCertificadosDisposicion() {
  const { data, isLoading, error, mutate } = useSWR<CertificadoDisposicion[]>("/certificado-disposicion", fetcher)
  return { certificados: data ?? [], isLoading, error, mutate }
}

export function useCreateCertificadoDisposicion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/certificado-disposicion",
    (_key: string, { arg }: { arg: CreateCertificadoDisposicionPayload }) =>
      certificadoDisposicionApi.create(arg),
  )
  return { createCertificado: trigger, isLoading: isMutating, error }
}

export function useUpdateCertificadoDisposicion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/certificado-disposicion",
    (_key: string, { arg }: { arg: { id: number } & UpdateCertificadoDisposicionPayload }) => {
      const { id, ...payload } = arg
      return certificadoDisposicionApi.update(id, payload)
    },
  )
  return { updateCertificado: trigger, isLoading: isMutating, error }
}

export function useDeleteCertificadoDisposicion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/certificado-disposicion",
    (_key: string, { arg }: { arg: number }) => certificadoDisposicionApi.remove(arg),
  )
  return { deleteCertificado: trigger, isLoading: isMutating, error }
}
