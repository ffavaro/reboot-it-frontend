export interface TokenPayload {
  id: number
  nombre: string
  email: string
  rolId: number
  cuitDni?: string
  isActive: boolean
  rol?: { id: number; nombre: string }
  iat: number
  exp: number
}

import { jwtDecode } from "jwt-decode"

function decodePayload(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token)
  if (!payload) return true
  return Date.now() >= payload.exp * 1000
}

export function saveSession(token: string): void {
  const payload = decodePayload(token)
  const maxAge = payload ? payload.exp - Math.floor(Date.now() / 1000) : 3600
  document.cookie = `session=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)session=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function clearSession(): void {
  document.cookie = 'session=; path=/; max-age=0'
}

export function getUser(): TokenPayload | null {
  const token = getToken()
  if (!token) return null
  if (isTokenExpired(token)) {
    clearSession()
    return null
  }
  return decodePayload(token)
}
