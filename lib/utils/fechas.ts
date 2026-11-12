export const MESES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]
export const DIAS_CAL_CORTOS = ["Lu", "Ma", "Mi", "Ju", "Vi"]
export const DIAS_CAL_LARGOS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
]

const SOLO_DIA = /^(\d{4})-(\d{2})-(\d{2})(?:$|T00:00:00(?:\.0+)?Z?$)/

export const dos = (n: number) => String(n).padStart(2, "0")

export const isoDe = (f: Date) => `${f.getFullYear()}-${dos(f.getMonth()+1)}-${dos(f.getDate())}`
export const hoyIso = () => isoDe(new Date())

export function dia(valor: string | null | undefined): string {
  if (!valor) return ""
  const partes = SOLO_DIA.exec(valor)
  if (partes) return `${partes[3]}/${partes[2]}/${partes[1]}`
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime())
    ? ""
    : fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function hora(valor: string | null | undefined, conSegundos = false): string {
  if (!valor) return ""
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ""
  return fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    ...(conSegundos ? { second: "2-digit" } : {}),
    hour12: false,
  })
}

export function diaYHora(valor: string | null | undefined, conSegundos = false): string {
  const h = hora(valor, conSegundos)
  return h ? `${dia(valor)} ${h} hs` : ""
}

export const MESES_CORTOS = MESES_ES.map((m) => m.slice(0, 3))

export function parseISO(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) } : null
}

export function esFinDeSemana(iso: string) {
  const p = parseISO(iso)
  if (!p) return false
  const dia = new Date(p.year, p.month, p.day).getDay()
  return dia === 0 || dia === 6
}

export function formatLabel(iso: string) {
  const p = parseISO(iso)
  return p ? `${dos(p.day)} ${MESES_CORTOS[p.month]} ${p.year}` : ""
}

export const horaEnPunto = (iso: string | Date) => `${dos(new Date(iso).getHours())}:00`

export const diaLargo = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

export const diaMes = (d: Date, conAnio = false) =>
  d.toLocaleDateString("es-AR", { day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}) })

export const diaYHoraLargo = (valor: string | Date, conAnio = false) =>
  new Date(valor).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(conAnio ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

export const aFechaHoraLocal = (m: Date) => `${isoDe(m)}T${dos(m.getHours())}:${dos(m.getMinutes())}`

export function sumarDias(cantidad: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + cantidad)
  return isoDe(fecha)
}
