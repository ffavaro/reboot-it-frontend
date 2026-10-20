"use client"

import { useState } from "react"
import { MapPin, MessageCircle, Send, CheckCircle2, FileText, FileDown } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useHojasRutaDia, useGenerarHojaRuta } from "@/hooks/use-hoja-ruta"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { getUser } from "@/lib/auth-utils"
import { getErrorMessage, getTransportistaActual, formatFechaISO, todayISO } from "@/lib/utils/helpers"
import { hojaRutaApi } from "@/lib/api/hoja-ruta"
import { descargarConstanciaPdf } from "@/lib/utils/constancia-pdf"
import { ESTADOS_HOJA_RUTA } from "@/lib/type/hoja-ruta"
import type { EstadoHojaRuta, HojaIniciadaPendiente, HojaRutaDia, ParadaHojaRuta } from "@/lib/type/hoja-ruta"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { HojaRutaCard, buildWhatsAppUrl } from "./hoja-ruta-card"
import { ConfirmarRetiroDialog } from "./confirmar-retiro-dialog"
import { ConstanciaDialog } from "./constancia-dialog"
import { HistoricoTab } from "./historico-tab"

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
  const [desde, setDesde] = useState(todayISO())
  const [hasta, setHasta] = useState(todayISO())
  const [transportistaId, setTransportistaId] = useState("")
  const [estado, setEstado] = useState<EstadoHojaRuta | "">("")

  const { transportistas } = useEmpleadosTransportistas()
  const { hojas, isLoading } = useHojasRutaDia({
    fechaDesde: desde,
    fechaHasta: hasta,
    empleadoTransportistaId: transportistaId ? Number(transportistaId) : undefined,
    estado: estado || undefined,
  })
  const rangoModificado = desde !== todayISO() || hasta !== todayISO()

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
                onClick={() => { setTransportistaId(""); setEstado(""); setDesde(todayISO()); setHasta(todayISO()) }}
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

  const { hojas, isLoading, mutate } = useHojasRutaDia(
    { empleadoTransportistaId: myTransportista?.id, fechaDesde: sumarDias(-DIAS_ATRAS), fechaHasta: sumarDias(DIAS_ADELANTE) },
    !!myTransportista,
  )
  const { generarHojaRuta } = useGenerarHojaRuta()
  const [generando, setGenerando] = useState<string | null>(null)
  // Aviso cuando ya hay otra hoja iniciada con turnos pendientes de retiro
  const [alerta, setAlerta] = useState<{ hoja: HojaRutaDia; otras: HojaIniciadaPendiente[] } | null>(null)
  const [paradaAConfirmar, setParadaAConfirmar] = useState<ParadaHojaRuta | null>(null)
  const [constanciaDeTurno, setConstanciaDeTurno] = useState<number | null>(null)

  const pendientes = hojas.filter((h) => h.estado !== "Finalizada" && h.paradas.length > 0).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const finalizadas = hojas.filter((h) => h.estado === "Finalizada").sort((a, b) => b.fecha.localeCompare(a.fecha))

  // Genera la hoja de esa fecha y abre WhatsApp con el detalle. La pestaña se abre en el gesto del usuario
  // (si no, el navegador bloquea el popup) y se redirige cuando la hoja ya está generada.
  async function generarYCompartir(hoja: HojaRutaDia, confirmar = false) {
    const win = window.open("about:blank", "_blank")
    setGenerando(hoja.fecha)
    try {
      const generada = await generarHojaRuta({ empleadoTransportistaId: hoja.empleadoTransportistaId, fecha: hoja.fecha, confirmar })
      await mutate()
      setAlerta(null)
      const url = buildWhatsAppUrl(generada)
      if (win) {
        win.opener = null
        win.location.href = url
      } else {
        window.open(url, "_blank", "noopener,noreferrer")
      }
      toast.success("Hoja de ruta generada")
    } catch (error) {
      win?.close()
      const e = error as { code?: string; hojas?: HojaIniciadaPendiente[] }
      if (e?.code === "HOJA_INICIADA_PENDIENTE") setAlerta({ hoja, otras: e.hojas ?? [] })
      else toast.error(getErrorMessage(error, "No se pudo generar la hoja de ruta"))
    } finally {
      setGenerando(null)
    }
  }

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
            <Button disabled={generando !== null || h.paradas.length === 0 || !h.vehiculo} onClick={() => generarYCompartir(h)}>
              <Send className="h-4 w-4" />
              {generando === h.fecha ? "Generando..." : "Generar y compartir hoja de ruta"}
            </Button>
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
          Tus turnos pendientes de retiro, agrupados por fecha. Generá la hoja de ruta de cada día, compartila y confirmá cada retiro al hacerlo.
        </p>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando tu hoja de ruta…</p>
      ) : !myTransportista ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Todavía no tenés un vehículo asignado. Pedile a un administrador que te asigne uno en &quot;Empleado Transportista&quot;.
        </div>
      ) : pendientes.length === 0 && finalizadas.length === 0 ? (
        <p className="py-4 text-sm italic text-muted-foreground">No tenés turnos pendientes de retiro.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {pendientes.length === 0 && <p className="text-sm italic text-muted-foreground">No tenés turnos pendientes de retiro.</p>}
            {pendientes.map(tarjeta)}
          </div>
          {finalizadas.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">Hojas de ruta finalizadas recientemente</h2>
              {finalizadas.map(tarjeta)}
            </div>
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

      {/* Aviso: ya hay otra hoja iniciada con turnos pendientes de retiro */}
      <Dialog open={!!alerta} onOpenChange={(v) => { if (!v) setAlerta(null) }}>
        <DialogContent className="max-w-md gap-0 p-0">
          <div className="rounded-t-2xl bg-amber-50 px-6 py-4 pr-12 dark:bg-amber-900/20">
            <DialogTitle className="text-lg font-semibold">Tenés otra hoja de ruta iniciada</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Todavía tiene turnos pendientes de retiro.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-3 px-6 py-5 text-sm">
            <ul className="flex flex-col gap-1">
              {alerta?.otras.map((o) => (
                <li key={o.id} className="flex justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="font-medium">Hoja del {formatFechaISO(o.fecha)}</span>
                  <span className="text-muted-foreground">{o.pendientes} turno{o.pendientes !== 1 ? "s" : ""} pendiente{o.pendientes !== 1 ? "s" : ""}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              ¿Querés generar igual la hoja de ruta del {alerta ? formatFechaISO(alerta.hoja.fecha) : ""}?
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 rounded-b-2xl px-6 py-4">
            <Button variant="outline" onClick={() => setAlerta(null)}>Cancelar</Button>
            <Button onClick={() => alerta && generarYCompartir(alerta.hoja, true)}>Generar igual</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function HojaRutaPage() {
  const rolNombre = getUser()?.rol?.nombre?.toLowerCase() ?? ""
  return ROLES_VEN_TODAS_LAS_HOJAS.includes(rolNombre) ? <AdminView /> : <TransportistaView />
}
