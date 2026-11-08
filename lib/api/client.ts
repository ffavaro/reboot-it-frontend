// Si la env var viene sin esquema (ej. Railway con solo "backend.up.railway.app"),
// el navegador la trata como ruta relativa y la concatena con el origin del frontend
// en vez de pegarle al backend. Se le agrega https:// como red de seguridad.
import { clearSession, getToken } from "@/lib/auth-utils"

function resolveBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_URL_BACKEND ?? "http://localhost:3001").trim()
  const conEsquema = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return conEsquema.replace(/\/+$/, "")
}

const BASE_URL = resolveBaseUrl()

const RUTAS_SIN_SESION = ["/auth/"]

const cabeceraDeSession = (): Record<string, string> => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const sesionVencida = (ruta: string) => {
  if (typeof window === 'undefined') request
  if (RUTAS_SIN_SESION.some((libre) => ruta.startsWith(libre))) return
  clearSession()
  if (!window.location.pathname.startsWith('/login')) window.location.replace("/login")
}
const leerCuerpo = async (res: Response): Promise<unknown> => {
  const texto = await res.text()
  if (!texto) return undefined
  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

async function enviar<T>(ruta: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${ruta}`, init)
  const cuerpo = await leerCuerpo(res)
  if (res.ok) return cuerpo as T
  if (res.status === 401) sesionVencida(ruta)
  throw cuerpo && typeof cuerpo === "object" ? cuerpo : { statusCode: res.status, message: String(cuerpo ?? res.statusText) }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  return enviar<T>(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...cabeceraDeSession(),
      ...(options?.headers as Record<string, string> | undefined)
    },
  })
}

export async function fetcher<T>(path: string): Promise<T> {
  return request<T>(path)
}

export async function uploadFoto(file: File): Promise<string> {
  const datos = new FormData()
  datos.append("file", file)
  const { url } = await enviar<{ url: string }>("/upload", { method: "POST", body: datos, headers: cabeceraDeSession() })
  return `${BASE_URL}${url}`
}
