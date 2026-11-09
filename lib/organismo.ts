import type { TipoDonante } from "@/lib/type/donante"

export const JURISDICCIONES = ["Nacional", "Provincial", "Municipal"] as const

export const LARGO_NOMBRE_PERSONA = 25
export const LARGO_NOMBRE_COMPLETO = 50
export const LARGO_CARGO = 100

const sinAcentos = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export const esOrganismoPublico = (tipo: TipoDonante | undefined | null) =>
  !!tipo && /organismo|public/.test(sinAcentos(tipo.descripcion))

export const esPersonaJuridica = (tipo: TipoDonante | undefined | null) =>
  !!tipo && /empresa|organismo|public/.test(sinAcentos(tipo.descripcion))

export const soloLetras = (texto: string) => /^[\p{L} ]+$/u.test(texto.trim())

export function unirResponsable(apellido: string, nombre: string): string {
  return `${apellido.trim()}, ${nombre.trim()}`
}

export function separarResponsable(responsable: string | null | undefined): { respApellido: string; respNombre: string } {
  if (!responsable) return { respApellido: "", respNombre: "" }
  const [apellido, ...resto] = responsable.split(",")
  return { respApellido: apellido.trim(), respNombre: resto.join(",").trim() }
}

export function problemaDeNombre(texto: string, etiqueta: string, largo = LARGO_NOMBRE_PERSONA): string | null {
  const valor = texto.trim()
  if (!valor) return `Ingresá ${etiqueta}`
  if (!soloLetras(valor)) return "Solo se permiten letras"
  if (valor.length > largo) return `Máximo ${largo} caracteres`
  return null
}
