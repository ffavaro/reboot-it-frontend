// Si la env var viene sin esquema (ej. Railway con solo "backend.up.railway.app"),
// el navegador la trata como ruta relativa y la concatena con el origin del frontend
// en vez de pegarle al backend. Se le agrega https:// como red de seguridad.
import { getToken } from "@/lib/auth-utils"

function resolveBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_URL_BACKEND ?? "http://localhost:3001").trim()
  const conEsquema = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return conEsquema.replace(/\/+$/, "")
}

const BASE_URL = resolveBaseUrl()

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
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
  const token = getToken()
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw error
  }
  const data: { url: string } = await res.json()
  return `${BASE_URL}${data.url}`
}
