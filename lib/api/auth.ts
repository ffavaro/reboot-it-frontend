import type { LoginPayload, AuthResponse } from "@/lib/type/auth"
import { request } from "./client"

export const authApi = {
  login: (data: LoginPayload) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  register: (data: { name: string; email: string; password: string; cuitDni: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  forgotPassword: (data: { email: string }) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
}
