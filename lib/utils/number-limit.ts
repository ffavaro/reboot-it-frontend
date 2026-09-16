import { toast } from "react-toastify"

export const DEFAULT_WEIGHT_MAX_DIGITS = 10

export function enforceDecimalInput(value: string, maxDigits: number, label: string): string {
  let sanitized = value.replace(/[^0-9.]/g, "")

  const firstDot = sanitized.indexOf(".")
  if (firstDot !== -1) {
    sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, "")
  }

  if (sanitized !== value) {
    toast.error(`${label} solo admite números`, { toastId: `only-numbers-${label}` })
  }

  const digitCount = sanitized.replace(/\D/g, "").length
  if (digitCount > maxDigits) {
    toast.error(`${label} no puede superar los ${maxDigits} dígitos`, { toastId: `max-digits-${label}` })
    let result = ""
    let count = 0
    for (const ch of sanitized) {
      if (/\d/.test(ch)) {
        if (count >= maxDigits) continue
        count++
      }
      result += ch
    }
    sanitized = result
  }

  return sanitized
}
