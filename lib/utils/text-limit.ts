import { toast } from "react-toastify"

export const DEFAULT_TEXT_MAX = 25

export function enforceMaxLength(value: string, max: number, label: string): string {
  if (value.length <= max) return value
  toast.error(`${label} no puede superar los ${max} caracteres`, { toastId: `max-length-${label}` })
  return value.slice(0, max)
}
