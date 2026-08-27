import type { ReporteInventario } from "@/lib/type/material"

export type Periodo = "mes" | "trimestre" | "semestre" | "año"

export const PERIODO_LABELS: Record<Periodo, string> = {
  mes: "Mensual",
  trimestre: "Trimestral",
  semestre: "Semestral",
  año: "Anual",
}

export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export type RangoFechas = {
  fechaDesde: string
  fechaHasta: string
  label: string
  meses: number[]
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function getRangoFechas(periodo: Periodo, ref: Date = new Date()): RangoFechas {
  const year = ref.getFullYear()
  const month = ref.getMonth()

  if (periodo === "mes") {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return { fechaDesde: toISODate(start), fechaHasta: toISODate(end), label: `${MESES_CORTOS[month]} ${year}`, meses: [month] }
  }

  if (periodo === "trimestre") {
    const q = Math.floor(month / 3)
    const startMonth = q * 3
    const start = new Date(year, startMonth, 1)
    const end = new Date(year, startMonth + 3, 0)
    const meses = [startMonth, startMonth + 1, startMonth + 2]
    return { fechaDesde: toISODate(start), fechaHasta: toISODate(end), label: `T${q + 1} ${year} (${MESES_CORTOS[startMonth]}–${MESES_CORTOS[startMonth + 2]})`, meses }
  }

  if (periodo === "semestre") {
    const s = month < 6 ? 0 : 1
    const startMonth = s * 6
    const start = new Date(year, startMonth, 1)
    const end = new Date(year, startMonth + 6, 0)
    const meses = Array.from({ length: 6 }, (_, i) => startMonth + i)
    return { fechaDesde: toISODate(start), fechaHasta: toISODate(end), label: `${s === 0 ? "1er" : "2do"} semestre ${year}`, meses }
  }

  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const meses = Array.from({ length: 12 }, (_, i) => i)
  return { fechaDesde: toISODate(start), fechaHasta: toISODate(end), label: `Año ${year}`, meses }
}

export function getRangoAnterior(periodo: Periodo, ref: Date = new Date()): RangoFechas {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  if (periodo === "mes") return getRangoFechas("mes", new Date(year, month - 1, 1))
  if (periodo === "trimestre") return getRangoFechas("trimestre", new Date(year, month - 3, 1))
  if (periodo === "semestre") return getRangoFechas("semestre", new Date(year, month - 6, 1))
  return getRangoFechas("año", new Date(year - 1, month, 1))
}

export function getBucketOrder(periodo: Periodo, rango: RangoFechas): string[] {
  if (periodo === "mes") {
    const ultimoDia = Number(rango.fechaHasta.slice(-2))
    const semanas = Math.ceil(ultimoDia / 7)
    return Array.from({ length: semanas }, (_, i) => `Sem ${i + 1}`)
  }
  return rango.meses.map(m => MESES_CORTOS[m])
}

export function getBucketKey(iso: string, periodo: Periodo): string {
  const d = new Date(iso)
  if (periodo === "mes") return `Sem ${Math.ceil(d.getDate() / 7)}`
  return MESES_CORTOS[d.getMonth()]
}

export type ClasificacionCounts = { reutilizable: number; reciclable: number; desecho: number; pendiente: number }

export function clasificarMateriales(materiales: ReporteInventario[], condicionPorId: Map<number, string>): ClasificacionCounts {
  const counts: ClasificacionCounts = { reutilizable: 0, reciclable: 0, desecho: 0, pendiente: 0 }
  materiales.forEach(m => {
    const nombre = (condicionPorId.get(m.condicionMaterialId) ?? "").toLowerCase()
    if (nombre.includes("reutil")) counts.reutilizable++
    else if (nombre.includes("recicl")) counts.reciclable++
    else if (nombre.includes("desecho")) counts.desecho++
    else counts.pendiente++
  })
  return counts
}

export function pctChange(actual: number, anterior: number): number {
  if (anterior === 0) return actual === 0 ? 0 : 100
  return Math.round(((actual - anterior) / anterior) * 100)
}
