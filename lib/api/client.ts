import { clearSession, getToken } from "@/lib/auth-utils"

// Si la env var viene sin esquema (ej. Railway con solo "backend.up.railway.app"),
// el navegador la trata como ruta relativa y la concatena con el origin del frontend
// en vez de pegarle al backend. Se le agrega https:// como red de seguridad.
function resolveBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_URL_BACKEND ?? "http://localhost:3001").trim()
  const conEsquema = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return conEsquema.replace(/\/+$/, "")
}

const BASE_URL = resolveBaseUrl()

// token: permite usar uno explícito (ej. el del usuario recién registrado, que todavía no tiene sesión guardada)
type RequestOptions = RequestInit & { token?: string }

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 401 en una ruta protegida = el token venció o no es válido: se limpia la sesión y se vuelve al login.
// Las rutas /auth/* quedan afuera: ahí un 401 es "credenciales inválidas" (un email ya registrado responde 409).
function handleUnauthorized(path: string) {
  if (typeof window === "undefined" || path.startsWith("/auth/")) return
  clearSession()
  if (!window.location.pathname.startsWith("/login")) window.location.assign("/login")
}

export async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const { token, headers, ...rest } = options ?? {}
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token ?? getToken()),
      ...(headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(path)
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }

  return res.json()
}

export async function fetcher<T>(path: string): Promise<T> {
  return request<T>(path)
}

export async function uploadFoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)
  // Sin Content-Type: el navegador arma el multipart con su boundary
  const res = await fetch(`${BASE_URL}/upload`, { method: "POST", headers: authHeaders(getToken()), body: formData })
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized("/upload")
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }
  const data: { url: string } = await res.json()
  return `${BASE_URL}${data.url}`
}
