import useSWRMutation from "swr/mutation"
import { authApi } from "@/lib/api"
import { LoginPayload } from "@/lib/type"
import { useSyncExternalStore } from "react"
import { getUser } from "@/lib/auth-utils"
import { perfilDeUsuario } from "@/lib/type/menu"
import type { Perfil } from "@/lib/type/sidebar"

export function useLogin() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/auth/login",
    (_key: string, { arg }: { arg: LoginPayload }) => authApi.login(arg),
  )

  return {
    login: trigger,
    isLoading: isMutating,
    error,
  }
}

export function useRegister() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/usuarios",
    (_key: string, { arg }: { arg: Parameters<typeof authApi.register>[0] }) =>
      authApi.register(arg),
  )

  return {
    register: trigger,
    isLoading: isMutating,
    error,
  }
}

export function useForgotPassword() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/auth/forgot-password",
    (_key: string, { arg }: { arg: { email: string } }) =>
      authApi.forgotPassword(arg),
  )

  return {
    sendReset: trigger,
    isLoading: isMutating,
    error,
  }
}

export function useResetPassword() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/auth/reset-password",
    (_key: string, { arg }: { arg: Parameters<typeof authApi.resetPassword>[0] }) =>
      authApi.resetPassword(arg),
  )

  return {
    resetPassword: trigger,
    isLoading: isMutating,
    error,
  }
}

const sinSuscripcion = () => () => {}
const leerPerfil = (): Perfil => perfilDeUsuario(getUser())
const perfilEnServidor = (): Perfil | null => null

export function usePerfil(): Perfil | null {
  return useSyncExternalStore(sinSuscripcion, leerPerfil, perfilEnServidor)
}
