export type Validator = (value: unknown) => string | null

export const required = (label: string): Validator => (value) =>
  !String(value ?? "").trim() ? `Ingresá ${label}` : null

export const requiredSelect = (label: string): Validator => (value) => {
  const v = String(value ?? "").trim()
  return v === "" || v === "0" ? `Seleccioná ${label}` : null
}

export const minLength = (n: number): Validator => (value) => {
  const s = String(value ?? "")
  return s.length > 0 && s.length < n ? `Mínimo ${n} caracteres` : null
}

export const maxLength = (n: number): Validator => (value) => {
  const s = String(value ?? "")
  return s.length > n ? `Máximo ${n} caracteres` : null
}

export const positiveNumber = (): Validator => (value) => {
  if (value === "" || value == null) return null
  return Number(value) <= 0 ? "Debe ser mayor a 0" : null
}

export const maxDigits = (n: number): Validator => (value) => {
  const digitsOnly = String(value ?? "").replace(/\D/g, "")
  return digitsOnly.length > n ? `No puede superar los ${n} dígitos` : null
}

export const cuitFormat = (): Validator => (value) => {
  const s = String(value ?? "").trim()
  return s && !/^\d{2}-\d{8}-\d$/.test(s) ? "Formato inválido (XX-XXXXXXXX-X)" : null
}

export const onlyLetters = (): Validator => (value) => {
  const s = String(value ?? "").trim()
  return s && !/^[a-zA-ZÀ-ÿ\s]+$/.test(s) ? "Solo se permiten letras" : null
}

export const emailFormat = (): Validator => (value) => {
  const s = String(value ?? "").trim()
  return s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? "Formato de email inválido" : null
}

export const run = (value: unknown, validators: Validator[]): string | null => {
  for (const v of validators) {
    const err = v(value)
    if (err) return err
  }
  return null
}
