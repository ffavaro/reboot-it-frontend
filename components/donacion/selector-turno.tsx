"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { aFechaHoraLocal, DIAS_CAL_CORTOS, diaLargo, diaYHoraLargo, horaEnPunto, MESES_ES } from "@/lib/utils/fechas"
import {
  HORARIOS,
  RANGO_ATENCION,
  atiendeHoy,
  diaHabilitado,
  diasDelMes,
  horarioVencido,
  mismoDia,
  momentoDe,
  primerDiaDisponible,
} from "@/lib/utils/formato"
import type { Turno } from "@/lib/type/turno"

type Props = {
  turnos: Turno[]
  valor: string
  alElegir: (fechaHora: string) => void
}

export function SelectorTurno({ turnos, valor, alElegir }: Props) {
  const [dia, setDia] = useState<Date>(() => primerDiaDisponible())
  const [vista, setVista] = useState(() => ({ anio: dia.getFullYear(), mes: dia.getMonth() }))

  const activos = useMemo(() => turnos.filter((t) => t.isActive), [turnos])
  const ocupados = useMemo(
    () => new Set(activos.filter((t) => mismoDia(new Date(t.fechaHora), dia)).map((t) => horaEnPunto(t.fechaHora))),
    [activos, dia],
  )
  const conTurnos = (d: Date) => activos.some((t) => mismoDia(new Date(t.fechaHora), d))

  const hoy = new Date()
  const elegido = valor ? new Date(valor) : null

  function moverMes(paso: number) {
    setVista(({ anio, mes }) => {
      const destino = new Date(anio, mes + paso, 1)
      return { anio: destino.getFullYear(), mes: destino.getMonth() }
    })
  }

  function elegirDia(d: Date) {
    if (mismoDia(d, hoy) && !atiendeHoy(hoy)) {
      toast.warning(`El horario de atención de hoy ya terminó (${RANGO_ATENCION}). Elegí otro día.`, { toastId: "fuera-de-horario" })
      return
    }
    setDia(d)
    alElegir("")
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Fecha del turno *</span>

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => moverMes(-1)} className="rounded p-1 hover:bg-muted" aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{MESES_ES[vista.mes]} {vista.anio}</span>
          <button type="button" onClick={() => moverMes(1)} className="rounded p-1 hover:bg-muted" aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-y-0.5">
          {DIAS_CAL_CORTOS.map((nombre) => (
            <span key={nombre} className="py-1 text-center text-xs font-medium text-muted-foreground">{nombre}</span>
          ))}
          {diasDelMes(vista.anio, vista.mes).map((d, i) => {
            if (!d) return <span key={`hueco-${i}`} />
            const habilitado = diaHabilitado(d, hoy)
            const actual = mismoDia(d, dia)
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={!habilitado}
                onClick={() => elegirDia(d)}
                className={cn(
                  "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors",
                  actual && "bg-primary font-semibold text-primary-foreground",
                  !actual && habilitado && "hover:bg-muted",
                  !habilitado && "cursor-not-allowed opacity-25",
                )}
              >
                {d.getDate()}
                {conTurnos(d) && !actual && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/50" />
                )}
              </button>
            )
          })}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          El punto marca días con turnos registrados. Se atiende de lunes a viernes, de {RANGO_ATENCION}.
        </p>
      </div>

      <span className="text-xs font-medium text-muted-foreground">
        Horarios del {diaLargo(dia)}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {HORARIOS.map((horario) => {
          const tomado = ocupados.has(horario)
          const pasado = horarioVencido(dia, horario, hoy)
          const activo = !!elegido && elegido.getTime() === momentoDe(dia, horario).getTime()
          return (
            <button
              key={horario}
              type="button"
              disabled={tomado || pasado}
              title={pasado ? "Ese horario ya pasó" : tomado ? "Horario ocupado" : undefined}
              onClick={() => alElegir(aFechaHoraLocal(momentoDe(dia, horario)))}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                activo && "bg-primary text-primary-foreground",
                !activo && !tomado && !pasado && "bg-muted hover:bg-muted/70",
                (tomado || pasado) && "cursor-not-allowed bg-muted/40 text-muted-foreground line-through",
              )}
            >
              {horario}
            </button>
          )
        })}
      </div>

      {elegido && (
        <p className="text-xs text-muted-foreground">
          Turno:{" "}
          <span className="font-medium text-foreground">
            {diaYHoraLargo(elegido)}
          </span>
        </p>
      )}
    </div>
  )
}
