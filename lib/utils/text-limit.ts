import { toast } from "react-toastify"

export const DEFAULT_TEXT_MAX = 50

export function enforceMaxLength(value: string, max: number, label: string): string {
  if (value.length <= max) return value
  toast.error(`${label} no puede superar los ${max} caracteres`, { toastId: `max-length-${label}` })
  return value.slice(0, max)
}

export const FOTOS_MAXIMAS = 5
export const MB_POR_FOTO = 5
export const FORMATOS_FOTO = ["image/jpeg", "image/png", "image/webp"]
export const DIGITOS_CANTIDAD = 4

export function tieneNumeroDeCalle(direccion: string): boolean {
  const primeraParte = direccion.split(",")[0] ?? ""
  return /\p{L}.*\s\d{1,5}\b/u.test(primeraParte.trim())
}

export const soloEnteros = (texto: string) => texto.replace(/\D/g, "").slice(0, DIGITOS_CANTIDAD)

export function problemaConFoto(archivo: File): string | null {
  if (!FORMATOS_FOTO.includes(archivo.type)) return "Las fotos deben ser imágenes JPG, PNG o WEBP"
  if (archivo.size > MB_POR_FOTO * 1024 * 1024) return `Cada foto puede pesar hasta ${MB_POR_FOTO} MB`
  return null
}
