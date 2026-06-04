import { getUser } from "@/lib/auth-utils"
import type { Donante } from "@/lib/type/donante"

export function getDonanteActual(donantes: Donante[]) {
  const user = getUser()
  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d) => d.usuarioId === user?.id) ?? null
    : null
  return { user, isDonante, myDonante }
}

export const formatDate = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export const formatDateTime = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export const validateEmail = (v: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const validateCuitDni = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length === 8 || digits.length === 11;
}