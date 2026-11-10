"use client"

import { useState } from "react"
import { MapPin, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useHojasRutaDia } from "@/hooks/use-hoja-ruta"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { sumarDias } from "@/lib/utils/fechas"
import { abrirEnPestana, ESTILO_SELECT, urlWhatsApp } from "@/lib/utils/hoja-ruta"
import { ESTADOS_HOJA_RUTA } from "@/lib/type/hoja-ruta"
import type { EstadoHojaRuta } from "@/lib/type/hoja-ruta"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { HojaRutaCard } from "./hoja-ruta-card"
import { GenerarHojaButton } from "./generar-hoja-button"
import { HistoricoTab } from "./historico-tab"

type Pestana = "hojas" | "historico"

const PESTANAS: [Pestana, string][] = [
  ["hojas", "Hojas de ruta"],
  ["historico", "Histórico de hojas de ruta"],
]

const TODOS = "todos"

const DIAS_ATRAS = 0
const DIAS_ADELANTE = 7

export function VistaAdministrativo() {
  const [pestana, setPestana] = useState<Pestana>("hojas")
  const [desde, setDesde] = useState(() => sumarDias(DIAS_ATRAS))
  const [hasta, setHasta] = useState(() => sumarDias(DIAS_ADELANTE))
  const [transportistaId, setTransportistaId] = useState("")
  const [estado, setEstado] = useState<EstadoHojaRuta | "">("")

  const { transportistas } = useEmpleadosTransportistas()

  const opcionesTransportistas = [
    { value: TODOS, label: "Todos los transportistas" },
    ...transportistas
      .filter((t: EmpleadoTransportista) => t.isActive)
      .map((t: EmpleadoTransportista) => ({
        value: String(t.id),
        label: t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : `Transportista #${t.id}`,
      })),
  ]

  const opcionesEstados = [
    { value: TODOS, label: "Todos los estados" },
    ...ESTADOS_HOJA_RUTA.map((e) => ({ value: e, label: e })),
  ]
  const { hojas, isLoading, mutate } = useHojasRutaDia({
    fechaDesde: desde,
    fechaHasta: hasta,
    empleadoTransportistaId: transportistaId ? Number(transportistaId) : undefined,
    estado: estado || undefined,
  })

  const rangoModificado = desde !== sumarDias(DIAS_ATRAS) || hasta !== sumarDias(DIAS_ADELANTE)

  function limpiarFiltros() {
    setTransportistaId("")
    setEstado("")
    setDesde(sumarDias(DIAS_ATRAS))
    setHasta(sumarDias(DIAS_ADELANTE))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Hoja de Ruta</h1>
        <p className="text-sm text-muted-foreground">
          Pedidos asignados a cada transportista, con la ruta optimizada y los km estimados.
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {PESTANAS.map(([clave, titulo]) => (
          <button
            key={clave}
            onClick={() => setPestana(clave)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              pestana === clave ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {titulo}
          </button>
        ))}
      </div>

      {pestana === "historico" ? (
        <HistoricoTab />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
              <DatePicker value={desde} onChange={(v) => v && setDesde(v)} max={hasta} soloHabiles aria-label="Hojas de ruta desde" />
              <span className="text-xs text-muted-foreground">→</span>
              <DatePicker value={hasta} onChange={(v) => v && setHasta(v)} min={desde} soloHabiles aria-label="Hojas de ruta hasta" />
            </div>
            <Select
              value={transportistaId || TODOS}
              onValueChange={(v) => setTransportistaId(v === TODOS ? "" : (v ?? ""))}
              items={opcionesTransportistas}
            >
              <SelectTrigger className={ESTILO_SELECT} aria-label="Filtrar por transportista">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcionesTransportistas.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={estado || TODOS}
              onValueChange={(v) => setEstado(v === TODOS ? "" : ((v ?? "") as EstadoHojaRuta | ""))}
              items={opcionesEstados}
            >
              <SelectTrigger className={ESTILO_SELECT} aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcionesEstados.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(transportistaId || estado || rangoModificado) && (
              <button onClick={limpiarFiltros} className="px-1 text-xs text-muted-foreground hover:text-foreground">
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {isLoading ? (
            <p className="py-4 text-sm text-muted-foreground">Cargando hojas de ruta…</p>
          ) : hojas.length === 0 ? (
            <p className="py-4 text-sm italic text-muted-foreground">
              No hay hojas de ruta para esos filtros: ningún transportista tiene turnos pendientes de retiro en ese período.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {hojas.map((h) => (
                <HojaRutaCard
                  key={`${h.empleadoTransportistaId}-${h.fecha}`}
                  hoja={h}
                  actions={
                    h.estado === "Pendiente" ? (
                      <GenerarHojaButton hoja={h} onGenerada={() => mutate()} />
                    ) : (
                      <>
                        <Button variant="outline" disabled={!h.mapsUrl} onClick={() => abrirEnPestana(h.mapsUrl!)}>
                          <MapPin className="h-4 w-4" />
                          Abrir en Google Maps
                        </Button>
                        <Button disabled={h.paradas.length === 0} onClick={() => abrirEnPestana(urlWhatsApp(h))}>
                          <MessageCircle className="h-4 w-4" />
                          Compartir por WhatsApp
                        </Button>
                      </>
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}