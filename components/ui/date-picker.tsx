"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
// Solo se pueden elegir días hábiles: la semana va de lunes a viernes
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi"]
const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function todayISO() {
  const d = new Date()
  return toISO(d.getFullYear(), d.getMonth(), d.getDate())
}

function parseISO(iso: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? { year: Number(m[1]), month: Number(m[2]) - 1, day: Number(m[3]) } : null
}

// Sábado y domingo no se pueden elegir
function esFinDeSemana(iso: string) {
  const p = parseISO(iso)
  if (!p) return false
  const dia = new Date(p.year, p.month, p.day).getDay()
  return dia === 0 || dia === 6
}

function formatLabel(iso: string) {
  const p = parseISO(iso)
  return p ? `${pad(p.day)} ${MESES_CORTOS[p.month]} ${p.year}` : ""
}

type DatePickerProps = {
  value: string                      // yyyy-MM-dd o ""
  onChange: (value: string) => void  // yyyy-MM-dd o ""
  min?: string
  max?: string
  placeholder?: string
  clearable?: boolean
  // "field" imita el estilo de los Input de los formularios; "inline" es el compacto de las barras de filtros
  variant?: "inline" | "field"
  // Por defecto solo se eligen días hábiles (turnos); los filtros de reportes necesitan también sábado y domingo
  conFinDeSemana?: boolean
  className?: string
  "aria-label"?: string
}

export function DatePicker({
  value, onChange, min, max, placeholder = "Seleccionar fecha", clearable = false, variant = "inline", conFinDeSemana = false, className, ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const initial = parseISO(value) ?? parseISO(todayISO())!
  const [view, setView] = React.useState({ year: initial.year, month: initial.month })

  // Al abrir, mostrar el mes de la fecha seleccionada
  function handleOpenChange(next: boolean) {
    if (next) {
      const p = parseISO(value) ?? parseISO(todayISO())!
      setView({ year: p.year, month: p.month })
    }
    setOpen(next)
  }

  function moverMes(delta: number) {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const dias = conFinDeSemana ? DIAS_SEMANA : DIAS
  const isDisabled = (iso: string) => (!!min && iso < min) || (!!max && iso > max) || (!conFinDeSemana && esFinDeSemana(iso))

  function elegir(iso: string) {
    if (isDisabled(iso)) return
    onChange(iso)
    setOpen(false)
  }

  // Celdas del mes: solo lunes a viernes, con huecos iniciales hasta el primer día hábil
  const diasMes = new Date(view.year, view.month + 1, 0).getDate()
  const habiles = Array.from({ length: diasMes }, (_, i) => i + 1).filter((d) => {
    if (conFinDeSemana) return true
    const dow = new Date(view.year, view.month, d).getDay()
    return dow !== 0 && dow !== 6
  })
  // Con fines de semana la semana va de lunes (0) a domingo (6)
  const columnaDe = (d: number) => (conFinDeSemana ? (new Date(view.year, view.month, d).getDay() + 6) % 7 : new Date(view.year, view.month, d).getDay() - 1)
  const offset = habiles.length ? columnaDe(habiles[0]) : 0
  const celdas: (number | null)[] = [...Array.from({ length: offset }, () => null), ...habiles]

  // Siempre 6 filas de días: el calendario no cambia de alto al pasar de mes
  while (celdas.length < dias.length * 6) celdas.push(null)

  const hoy = todayISO()
  const anioActual = new Date().getFullYear()
  const anioDesde = Math.min(min ? Number(min.slice(0, 4)) : anioActual - 30, view.year)
  const anioHasta = Math.max(max ? Number(max.slice(0, 4)) : anioActual + 15, view.year)
  const anios = Array.from({ length: anioHasta - anioDesde + 1 }, (_, i) => anioDesde + i)

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={props["aria-label"]}
            className={cn(
              variant === "field"
                ? "flex h-9 w-full items-center gap-2 rounded-4xl border border-transparent bg-muted/60 px-4 text-sm text-foreground shadow-xs transition-all outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                : "inline-flex items-center gap-1.5 h-7 rounded-md px-2 text-xs text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarDays className="size-3.5 text-muted-foreground" />
        <span className="tabular-nums">{value ? formatLabel(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className={conFinDeSemana ? "w-72 p-3" : "w-64 p-3"}>
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => moverMes(-1)}
            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-muted"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1">
            <select
              aria-label="Mes"
              value={view.month}
              onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
              className="h-7 rounded-md bg-transparent px-1 text-sm font-medium hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              aria-label="Año"
              value={view.year}
              onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
              className="h-7 rounded-md bg-transparent px-1 text-sm font-medium tabular-nums hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              {anios.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => moverMes(1)}
            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-muted"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className={cn("grid gap-0.5 text-center", conFinDeSemana ? "grid-cols-7" : "grid-cols-5")}>
          {dias.map(d => (
            <span key={d} className="text-[11px] font-medium text-muted-foreground py-1">{d}</span>
          ))}
          {celdas.map((dia, i) => {
            if (dia === null) return <span key={`v${i}`} className="h-8" />
            const iso = toISO(view.year, view.month, dia)
            const selected = iso === value
            const disabled = isDisabled(iso)
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => elegir(iso)}
                className={cn(
                  "h-8 rounded-md text-xs tabular-nums transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground",
                  !selected && iso === hoy && "ring-1 ring-primary/50 font-medium",
                  disabled && "opacity-30 pointer-events-none",
                )}
              >
                {dia}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => elegir(hoy)}
            disabled={isDisabled(hoy)}
            className="text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Hoy
          </button>
          {clearable && value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
