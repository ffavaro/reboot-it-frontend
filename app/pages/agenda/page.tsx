"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormModal } from "@/components/ui/form-modal"
import { useTurnos } from "@/hooks/use-turno"
import type { Turno } from "@/lib/type/turno"

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie"]
const HORA_INICIO = 8
const HORA_FIN = 17
const PX_POR_HORA = 50
const TOTAL_H = (HORA_FIN - HORA_INICIO) * PX_POR_HORA
const HORAS = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i)

function getLunes(fecha: Date): Date {
  const d = new Date(fecha)
  const dia = d.getDay()
  d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function topPx(fechaHora: string): number {
  const d = new Date(fechaHora)
  return (d.getHours() - HORA_INICIO + d.getMinutes() / 60) * PX_POR_HORA
}

const COLORES_ESTADO: Record<string, { bg: string; text: string; dot: string; borde: string }> = {
  pendiente:  { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500",   borde: "border-blue-400"   },
  confirmado: { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500",  borde: "border-green-400"  },
  "en curso": { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", borde: "border-orange-400" },
  completado: { bg: "bg-teal-100",   text: "text-teal-800",   dot: "bg-teal-500",   borde: "border-teal-400"   },
  cancelado:  { bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400",   borde: "border-gray-300"   },
}

const COLOR_DEFAULT = { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500", borde: "border-indigo-400" }

function colorEstado(descripcion?: string) {
  if (!descripcion) return COLOR_DEFAULT
  const key = Object.keys(COLORES_ESTADO).find((k) =>
    descripcion.toLowerCase().includes(k)
  )
  return key ? COLORES_ESTADO[key] : COLOR_DEFAULT
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

export default function AgendaPage() {
  const { turnos, isLoading } = useTurnos()
  const [inicioSemana, setInicioSemana] = useState(() => getLunes(new Date()))
  const [seleccionado, setSeleccionado] = useState<Turno | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const hoy = new Date()
  const diasSemana = Array.from({ length: 5 }, (_, i) => sumarDias(inicioSemana, i))
  const finSemana = sumarDias(inicioSemana, 5)
  const esSemanaActual = mismoDia(inicioSemana, getLunes(hoy))

  const nowTop = (() => {
    if (!esSemanaActual) return null
    const top = (hoy.getHours() - HORA_INICIO + hoy.getMinutes() / 60) * PX_POR_HORA
    return top >= 0 && top <= TOTAL_H ? top : null
  })()

  const turnosSemana = turnos.filter((t) => {
    const f = new Date(t.fechaHora)
    return f >= inicioSemana && f < finSemana && t.isActive
  })

  function turnosDia(dia: Date): Turno[] {
    return turnosSemana
      .filter((t) => mismoDia(new Date(t.fechaHora), dia))
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
  }

  function semanaAnterior() { setInicioSemana((d) => sumarDias(d, -7)); setSeleccionado(null) }
  function semanaSiguiente() { setInicioSemana((d) => sumarDias(d, 7)); setSeleccionado(null) }
  function irHoy() { setInicioSemana(getLunes(new Date())); setSeleccionado(null) }

  const etiquetaSemana = (() => {
    const inicio = inicioSemana.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
    const fin = sumarDias(inicioSemana, 6).toLocaleDateString("es-AR", {
      day: "numeric", month: "long", year: "numeric",
    })
    return `${inicio} – ${fin}`
  })()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Agenda semanal</h1>
        <p className="text-sm text-muted-foreground">Visualizá los turnos programados para la semana.</p>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 flex-wrap rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-3">
        <span className="text-xs font-medium text-muted-foreground mr-1">Estado:</span>
        {Object.entries(COLORES_ESTADO).map(([label, c]) => (
          <span key={label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${c.bg} ${c.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-3">
        <Button variant="outline" size="icon" onClick={semanaAnterior}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={semanaSiguiente}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={irHoy}>Hoy</Button>
        <span className="text-sm font-medium ml-1">{etiquetaSemana}</span>
        <span className="ml-auto text-sm text-muted-foreground">
          {isLoading
            ? "Cargando..."
            : `${turnosSemana.length} turno${turnosSemana.length !== 1 ? "s" : ""} esta semana`}
        </span>
      </div>

      <div className="rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5 overflow-hidden">
        {/* Cabecera fija con los días */}
        <div className="flex border-b border-border/60">
          <div className="w-16 shrink-0 border-r border-border/60 bg-muted/40" />
          <div className="flex-1 grid grid-cols-5 bg-muted/40">
            {diasSemana.map((dia, i) => {
              const esHoy = mismoDia(dia, hoy)
              return (
                <div
                  key={i}
                  className={`py-1.5 text-center border-r border-border/60 last:border-r-0${esHoy ? " bg-primary/10" : ""}`}
                >
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {DIAS_SEMANA[i]}
                  </div>
                  <div
                    className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold${
                      esHoy ? " bg-primary text-primary-foreground shadow-sm shadow-primary/30" : ""
                    }`}
                  >
                    {dia.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grilla horaria scrolleable */}
        <div className="flex overflow-y-auto" style={{ maxHeight: "560px" }}>
          {/* Columna de horas */}
          <div
            className="relative w-16 shrink-0 border-r border-border/60 bg-background"
            style={{ height: `${TOTAL_H}px` }}
          >
            {HORAS.map((hora) => (
              <div
                key={hora}
                className="absolute right-2 text-xs text-muted-foreground select-none"
                style={{ top: `${(hora - HORA_INICIO) * PX_POR_HORA + 4}px` }}
              >
                {String(hora).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Columnas de días con eventos */}
          <div
            className="relative flex-1 grid grid-cols-5"
            style={{ height: `${TOTAL_H}px` }}
          >
            {/* Líneas horizontales por hora */}
            {HORAS.map((hora) => (
              <div
                key={hora}
                className="absolute left-0 right-0 border-t border-border/40 pointer-events-none"
                style={{ top: `${(hora - HORA_INICIO) * PX_POR_HORA}px` }}
              />
            ))}

            {/* Indicador de hora actual */}
            {nowTop !== null && (
              <div
                className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                style={{ top: `${nowTop}px` }}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0 -ml-1" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            )}

            {/* Una columna por día */}
            {diasSemana.map((dia, i) => {
              const items = turnosDia(dia)
              const esHoy = mismoDia(dia, hoy)
              return (
                <div
                  key={i}
                  className={`relative border-r border-border/60 last:border-r-0${esHoy ? " bg-primary/5" : ""}`}
                >
                  {items.map((t) => {
                    const top = topPx(t.fechaHora)
                    if (top < 0 || top >= TOTAL_H) return null
                    const height = Math.min(PX_POR_HORA, TOTAL_H - top)
                    const c = colorEstado(t.estadoTurno?.descripcion)

                    return (
                      <button
                        key={t.id}
                        onClick={() => { setSeleccionado(t); setModalOpen(true) }}
                        className={`absolute left-1 right-1 rounded-lg px-1.5 py-1 text-left text-xs overflow-hidden cursor-pointer border-l-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${c.bg} ${c.text} ${c.borde}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="font-semibold leading-tight truncate">
                          {formatHora(t.fechaHora)}
                        </div>
                        {height > 30 && (
                          <div className="truncate leading-tight mt-0.5 opacity-90">
                            {t.donante?.nombre ?? `#${t.donanteId}`}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setSeleccionado(null) }}
        title="Detalle del turno"
        description={
          seleccionado
            ? new Date(seleccionado.fechaHora).toLocaleString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
                year: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : undefined
        }
        readOnly
      >
        {seleccionado && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Donante
              </p>
              <p className="font-medium">
                {seleccionado.donante?.nombre ?? `#${seleccionado.donanteId}`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Estado
              </p>
              {seleccionado.estadoTurno?.descripcion ? (
                (() => {
                  const c = colorEstado(seleccionado.estadoTurno.descripcion)
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                      {seleccionado.estadoTurno.descripcion}
                    </span>
                  )
                })()
              ) : (
                <span className="italic text-muted-foreground">—</span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Hora
              </p>
              <p className="font-medium">{formatHora(seleccionado.fechaHora)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                ID
              </p>
              <p className="font-mono text-muted-foreground">#{seleccionado.id}</p>
            </div>
            {seleccionado.descripcion && (
              <div className="col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Descripción
                </p>
                <p className="text-muted-foreground">{seleccionado.descripcion}</p>
              </div>
            )}
          </div>
        )}
      </FormModal>
    </div>
  )
}
