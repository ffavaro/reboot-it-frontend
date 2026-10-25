"use client"

import { useState } from "react"
import { MapPin, MessageCircle, CheckCircle2, FileText, FileDown } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { useHojasRutaDia } from "@/hooks/use-hoja-ruta"
import { useMisPermisos } from "@/hooks/use-permisos"
import { puede } from "@/lib/nav"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { getUser } from "@/lib/auth-utils"
import { getErrorMessage, getTransportistaActual, formatFechaISO, todayISO } from "@/lib/utils/helpers"
import { hojaRutaApi } from "@/lib/api/hoja-ruta"
import { descargarConstanciaPdf } from "@/lib/utils/constancia-pdf"
import { ESTADOS_HOJA_RUTA } from "@/lib/type/hoja-ruta"
import type { EstadoHojaRuta, HojaRutaDia, ParadaHojaRuta } from "@/lib/type/hoja-ruta"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { HojaRutaCard, buildWhatsAppUrl } from "./hoja-ruta-card"
import { ConfirmarRetiroDialog } from "./confirmar-retiro-dialog"
import { ConstanciaDialog } from "./constancia-dialog"
import { HistoricoTab } from "./historico-tab"
import { GenerarHojaButton } from "./generar-hoja-button"

// Estos roles no tienen vehículo propio: ven las hojas de ruta de todos los transportistas
const ROLES_VEN_TODAS_LAS_HOJAS = ["admin", "administrativo"]

type Tab = "hojas" | "historico"

const SELECT_CLASS =
  "h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

// ---------------------------------------------------------------------------
// Vista Administrador
// ---------------------------------------------------------------------------

function AdminView() {
  const [tab, setTab] = useState<Tab>("hojas")
  // Por defecto: la última semana y la próxima (así se ven también los turnos de los próximos días)
  const [desde, setDesde] = useState(() => sumarDias(-7))
  const [hasta, setHasta] = useState(() => sumarDias(7))
  const [transportistaId, setTransportistaId] = useState("")
  const [estado, setEstado] = useState<EstadoHojaRuta | "">("")

  const { transportistas } = useEmpleadosTransportistas()
  const { permisos } = useMisPermisos()
  const puedeGenerar = puede(permisos, "hoja_ruta", "crear")
  const { hojas, isLoading, mutate } = useHojasRutaDia({
    fechaDesde: desde,
    fechaHasta: hasta,
    empleadoTransportistaId: transportistaId ? Number(transportistaId) : undefined,
    estado: estado || undefined,
  })
  const rangoModificado = desde !== sumarDias(-7) || hasta !== sumarDias(7)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Hoja de Ruta</h1>
        <p className="text-sm text-muted-foreground">
          Pedidos asignados a cada transportista, con la ruta optimizada y los km estimados.
        </p>
      </div>

      <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {([["hojas", "Hojas de ruta"], ["historico", "Histórico de hojas de ruta"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "historico" ? (
        <HistoricoTab />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
              <DatePicker
                value={desde}
                onChange={(v) => v && setDesde(v)}
                max={hasta}
                aria-label="Hojas de ruta desde"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <DatePicker
                value={hasta}
                onChange={(v) => v && setHasta(v)}
                min={desde}
                aria-label="Hojas de ruta hasta"
              />
            </div>
            <select value={transportistaId} onChange={(e) => setTransportistaId(e.target.value)} className={SELECT_CLASS} aria-label="Filtrar por transportista">
              <option value="">Todos los transportistas</option>
              {transportistas.filter((t: EmpleadoTransportista) => t.isActive).map((t: EmpleadoTransportista) => (
                <option key={t.id} value={t.id}>
                  {t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : `Transportista #${t.id}`}
                </option>
              ))}
            </select>
            <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoHojaRuta | "")} className={SELECT_CLASS} aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              {ESTADOS_HOJA_RUTA.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            {(transportistaId || estado || rangoModificado) && (
              <button
                onClick={() => { setTransportistaId(""); setEstado(""); setDesde(sumarDias(-7)); setHasta(sumarDias(7)) }}
                className="px-1 text-xs text-muted-foreground hover:text-foreground"
              >
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
                    h.estado === "Pendiente" && puedeGenerar ? (
                      <GenerarHojaButton hoja={h} onGenerada={() => mutate()} />
                    ) : (
                      <>
                        <Button variant="outline" disabled={!h.mapsUrl} onClick={() => window.open(h.mapsUrl!, "_blank", "noopener,noreferrer")}>
                          <MapPin className="h-4 w-4" />
                          Abrir en Google Maps
                        </Button>
                        <Button disabled={h.paradas.length === 0} onClick={() => window.open(buildWhatsAppUrl(h), "_blank", "noopener,noreferrer")}>
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

// ---------------------------------------------------------------------------
// Vista Transportista: sus turnos pendientes de retiro agrupados por fecha, con el mapa de cada día
// ---------------------------------------------------------------------------

function sumarDias(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const pad = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Rango consultado: la última semana (por si quedó algún retiro atrasado) y los próximos días (máximo de 31 días del backend)
const DIAS_ATRAS = 7
const DIAS_ADELANTE = 23

function TransportistaView() {
  const { transportistas, isLoading: loadingTransportistas } = useEmpleadosTransportistas()
  const { myTransportista } = getTransportistaActual(transportistas)

  // Filtro por fecha: vacío = el rango habitual; con una fecha se ven solo las hojas de ese día
  const [fecha, setFecha] = useState("")
  const { hojas, isLoading, mutate } = useHojasRutaDia(
    fecha
      ? { empleadoTransportistaId: myTransportista?.id, fechaDesde: fecha, fechaHasta: fecha }
      : { empleadoTransportistaId: myTransportista?.id, fechaDesde: sumarDias(-DIAS_ATRAS), fechaHasta: sumarDias(DIAS_ADELANTE) },
    !!myTransportista,
  )
  const [paradaAConfirmar, setParadaAConfirmar] = useState<ParadaHojaRuta | null>(null)
  const [constanciaDeTurno, setConstanciaDeTurno] = useState<number | null>(null)

  const pendientes = hojas.filter((h) => h.estado !== "Finalizada" && h.paradas.length > 0).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const finalizadas = hojas.filter((h) => h.estado === "Finalizada").sort((a, b) => b.fecha.localeCompare(a.fecha))

  async function descargarPdf(turnoId: number) {
    try {
      descargarConstanciaPdf(await hojaRutaApi.constancia(turnoId))
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo descargar la constancia"))
    }
  }

  function tarjeta(h: HojaRutaDia) {
    const generada = h.estado === "En proceso"
    const finalizada = h.estado === "Finalizada"
    return (
      <HojaRutaCard
        key={`${h.empleadoTransportistaId}-${h.fecha}`}
        hoja={h}
        mostrarTransportista={false}
        actions={
          finalizada ? null : generada ? (
            <>
              <Button variant="outline" disabled={!h.mapsUrl} onClick={() => window.open(h.mapsUrl!, "_blank", "noopener,noreferrer")}>
                <MapPin className="h-4 w-4" />
                Abrir en Google Maps
              </Button>
              <Button onClick={() => window.open(buildWhatsAppUrl(h), "_blank", "noopener,noreferrer")}>
                <MessageCircle className="h-4 w-4" />
                Compartir por WhatsApp
              </Button>
            </>
          ) : (
            <p className="text-sm italic text-muted-foreground">El Administrativo todavía no generó esta hoja de ruta.</p>
          )
        }
        accionesParada={(p) =>
          p.retirado ? (
            p.constanciaId ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setConstanciaDeTurno(p.turnoId)}>
                  <FileText className="h-3.5 w-3.5" />
                  Ver constancia
                </Button>
                <Button variant="outline" size="sm" onClick={() => descargarPdf(p.turnoId)}>
                  <FileDown className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </>
            ) : null
          ) : generada ? (
            <Button size="sm" onClick={() => setParadaAConfirmar(p)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirmar retiro
            </Button>
          ) : null
        }
      />
    )
  }

  const cargando = loadingTransportistas || (!!myTransportista && isLoading)

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

          {pendientes.length === 0 && finalizadas.length === 0 ? (
            <p className="py-4 text-sm italic text-muted-foreground">
              {fecha ? `No tenés hojas de ruta para el ${formatFechaISO(fecha)}.` : "No tenés turnos pendientes de retiro."}
            </p>
          ) : (
        <>
          <div className="flex flex-col gap-4">
            {pendientes.length === 0 && !fecha && <p className="text-sm italic text-muted-foreground">No tenés turnos pendientes de retiro.</p>}
            {pendientes.map(tarjeta)}
          </div>
          {finalizadas.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">{fecha ? "Hojas de ruta finalizadas" : "Hojas de ruta finalizadas recientemente"}</h2>
              {finalizadas.map(tarjeta)}
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
          if (turnoId && resultado.constanciaId) setConstanciaDeTurno(turnoId)
        }}
      />

      <ConstanciaDialog turnoId={constanciaDeTurno} onClose={() => setConstanciaDeTurno(null)} />
    </div>
  )
}

export default function HojaRutaPage() {
  const rolNombre = getUser()?.rol?.nombre?.toLowerCase() ?? ""
  return ROLES_VEN_TODAS_LAS_HOJAS.includes(rolNombre) ? <AdminView /> : <TransportistaView />
}
