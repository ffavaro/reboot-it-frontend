const VACIO = "—"

const SOLO_DIA = /^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.0+)?Z?$)/

export function dia(valor: string | null | undefined): string {
  if (!valor) return VACIO
  const partes = SOLO_DIA.exec(valor)
  if (partes) return `${partes[3]}/${partes[2]}/${partes[1]}`
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime())
    ? VACIO
    : fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function diaYHora(valor: string | null | undefined): string {
  if (!valor) return VACIO
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return VACIO
  const hora = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
  return `${dia(valor)} ${hora} hs`
}

export const texto = (valor: string | number | null | undefined) =>
  valor === null || valor === undefined || valor === "" ? VACIO : String(valor)

export const kilos = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === "" ? VACIO : `${Number(valor)} kg`

export const numeroDocumento = (id: number) => String(id).padStart(6, "0")

export function hoyIso(): string {
  const ahora = new Date()
  const dos = (n: number) => String(n).padStart(2, "0")
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`
}
