import type { TipoDonante } from "@/lib/type/donante"

// Empresas y organismos se identifican por razón social; los particulares, por apellido y nombre
export function isLegalEntity(tipo: TipoDonante | undefined): boolean {
  if (!tipo) return false
  const desc = tipo.descripcion.toLowerCase()
  return desc.includes("empresa") || desc.includes("organismo") || desc.includes("público") || desc.includes("publico")
}

// Organismo público: pide datos propios (jurisdicción, responsable y cargo) y exige CUIT
export function isOrganismo(tipo: TipoDonante | undefined): boolean {
  if (!tipo) return false
  const desc = tipo.descripcion.toLowerCase()
  return desc.includes("organismo") || desc.includes("público") || desc.includes("publico")
}

export const JURISDICCIONES = ["Nacional", "Provincial", "Municipal"]
