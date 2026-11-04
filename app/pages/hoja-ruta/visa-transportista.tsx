"use client"

import { useState } from "react"
import { CheckCircle2, FileDown, FileText, MapPin, MessageCircle } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { useHojasRutaDia } from "@/hooks/use-hoja-ruta"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { useUsuarios } from "@/hooks/use-users"
import { hojaRutaApi } from "@/lib/api/hoja-ruta"
import { descargarConstanciaPdf } from "@/lib/utils/constancia-pdf"
import { formatFechaISO, getErrorMessage, getTransportistaActual, sumarDias } from "@/lib/utils/helpers"
import { abrirEnPestana, urlWhatsApp } from "@/lib/utils/hoja-ruta"
import type { HojaRutaDia, ParadaHojaRuta } from "@/lib/type/hoja-ruta"
import { HojaRutaCard } from "./hoja-ruta-card"
import { ConfirmarRetiroDialog } from "./confirmar-retiro-dialog"
import { ConstanciaDialog } from "./constancia-dialog"

const DIAS_ATRAS = 7
const DIAS_ADELANTE = 23

export function VistaTransportista() {
  const { usuarios } = useUsuarios()
  const { transportistas, isLoading: cargandoTransportistas } = useEmpleadosTransportistas()
  const { myTransportista } = getTransportistaActual(usuarios, transportistas)

  const [fecha, setFecha] = useState("")
  const [paradaAConfirmar, setParadaAConfirmar] = useState<ParadaHojaRuta | null>(null)
  const [turnoConstancia, setTurnoConstancia] = useState<number | null>(null)

  const filtro = fecha
    ? { empleadoTransportistaId: myTransportista?.id, fechaDesde: fecha, fechaHasta: fecha }
    : {
        empleadoTransportistaId: myTransportista?.id,
        fechaDesde: sumarDias(-DIAS_ATRAS),
        fechaHasta: sumarDias(DIAS_ADELANTE),
      }
  const { hojas, isLoading, mutate } = useHojasRutaDia(filtro, !!myTransportista)

  const pendientes = hojas
    .filter((h) => h.estado !== "Finalizada" && h.paradas.length > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const finalizadas = hojas
    .filter((h) => h.estado === "Finalizada")
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  async function bajarPdf(turnoId: number) {
    try {
      descargarConstanciaPdf(await hojaRutaApi.constancia(turnoId))
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo descargar la constancia"))
    }
  }

  function renderTarjeta(h: HojaRutaDia) {
    const enProceso = h.estado === "En proceso"
    const finalizada = h.estado === "Finalizada"

    let acciones = (
      <p className="text-sm italic text-muted-foreground">El Administrativo todavía no generó esta hoja de ruta.</p>
    )
    if (enProceso) {
      acciones = (
        <>
          <Button variant="outline" disabled={!h.mapsUrl} onClick={() => abrirEnPestana(h.mapsUrl!)}>
            <MapPin className="h-4 w-4" />
            Abrir en Google Maps
          </Button>
          <Button onClick={() => abrirEnPestana(urlWhatsApp(h))}>
            <MessageCircle className="h-4 w-4" />
            Compartir por WhatsApp
          </Button>
        </>
      )
    }

    return (
      <HojaRutaCard
        key={`${h.empleadoTransportistaId}-${h.fecha}`}
        hoja={h}
        mostrarTransportista={false}
        actions={finalizada ? null : acciones}
        accionesParada={(p) => {
          if (p.retirado) {
            if (!p.constanciaId) return null
            return (
              <>
                <Button variant="outline" size="sm" onClick={() => setTurnoConstancia(p.turnoId)}>
                  <FileText className="h-3.5 w-3.5" />
                  Ver constancia
                </Button>
                <Button variant="outline" size="sm" onClick={() => bajarPdf(p.turnoId)}>
                  <FileDown className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </>
            )
          }
          if (!enProceso) return null
          return (
            <Button size="sm" onClick={() => setParadaAConfirmar(p)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirmar retiro
            </Button>
          )
        }}
      />
    )
  }

  const cargando = cargandoTransportistas || (!!myTransportista && isLoading)
  const sinResultados = pendientes.length === 0 && finalizadas.length === 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Hoja de Ruta</h1>
        <p className="text-sm text-muted-foreground">
          Tus turnos pendientes de retiro, agrupados por fecha. El Administrativo genera la hoja de ruta de cada día y te la comparte; confirmá cada retiro al hacerlo.
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando tu hoja de ruta…</p>
      ) : !myTransportista ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Todavía no tenés un vehículo asignado. Pedile a un administrador que te asigne uno en &quot;Empleado Transportista&quot;.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Fecha</span>
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
              <DatePicker
                value={fecha}
                onChange={setFecha}
                clearable
                placeholder="Todas las fechas"
                aria-label="Ver la hoja de ruta de una fecha"
              />
            </div>
            {fecha && (
              <Button variant="ghost" size="sm" onClick={() => setFecha("")}>
                Ver todas
              </Button>
            )}
          </div>

          {sinResultados ? (
            <p className="py-4 text-sm italic text-muted-foreground">
              {fecha
                ? `No tenés hojas de ruta para el ${formatFechaISO(fecha)}.`
                : "No tenés turnos pendientes de retiro."}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {pendientes.length === 0 && !fecha && (
                  <p className="text-sm italic text-muted-foreground">No tenés turnos pendientes de retiro.</p>
                )}
                {pendientes.map(renderTarjeta)}
              </div>
              {finalizadas.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {fecha ? "Hojas de ruta finalizadas" : "Hojas de ruta finalizadas recientemente"}
                  </h2>
                  {finalizadas.map(renderTarjeta)}
                </div>
              )}
            </>
          )}
        </>
      )}

      <ConfirmarRetiroDialog
        parada={paradaAConfirmar}
        onClose={() => setParadaAConfirmar(null)}
        onConfirmado={async (resultado) => {
          const turnoId = paradaAConfirmar?.turnoId
          setParadaAConfirmar(null)
          await mutate()
          if (turnoId && resultado.constanciaId) setTurnoConstancia(turnoId)
        }}
      />

      <ConstanciaDialog turnoId={turnoConstancia} onClose={() => setTurnoConstancia(null)} />
    </div>
  )
}