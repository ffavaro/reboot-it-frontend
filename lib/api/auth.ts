import type { LoginPayload, AuthResponse } from "@/lib/type/auth"
import { request } from "./client"

export const authApi = {
  login: (data: LoginPayload) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  register: (data: { name: string; apellido?: string; email: string; password: string; cuitDni: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  // Recuperar contraseña: 1) se pide el código por email, 2) se lo ingresa con la contraseña nueva
  forgotPassword: (data: { email: string }) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),

  resetPassword: (data: { email: string; code: string; newPassword: string; confirmPassword: string }) =>
    request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
}
