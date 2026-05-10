import useSWRMutation from "swr/mutation"
import { authApi, type LoginPayload } from "@/lib/api"

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
