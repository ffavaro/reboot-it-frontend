"use client"

import { useState } from "react"
import { MapPin, MessageCircle, Flag } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldError } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { FormModal } from "@/components/ui/form-modal"
import { cn } from "@/lib/utils"
import { useHojasRutaDia, useIniciarHojaRuta, useFinalizarHojaRuta } from "@/hooks/use-hoja-ruta"
import { useUsuarios } from "@/hooks/use-users"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { getUser } from "@/lib/auth-utils"
import { getErrorMessage, getTransportistaActual, formatKm, todayISO } from "@/lib/utils/helpers"
import { ESTADOS_HOJA_RUTA } from "@/lib/type/hoja-ruta"
import type { EstadoHojaRuta, HojaRutaDia } from "@/lib/type/hoja-ruta"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { HojaRutaCard, buildWhatsAppUrl, nombreTransportista } from "./hoja-ruta-card"
import { HistoricoTab } from "./historico-tab"

// Estos roles no tienen vehículo propio: ven las hojas de ruta de todos los transportistas
const ROLES_VEN_TODAS_LAS_HOJAS = ["admin", "administrativo"]
const KM_MAX_DIGITS = 7

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
              No hay hojas de ruta para esos filtros: ningún transportista tiene pedidos con retiro confirmado en ese período.
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
// Vista Transportista: solo la hoja de ruta del día, con dos acciones
// ---------------------------------------------------------------------------

function TransportistaView() {
  const { usuarios, isLoading: loadingUsuarios } = useUsuarios()
  const { transportistas, isLoading: loadingTransportistas } = useEmpleadosTransportistas()
  const { myTransportista } = getTransportistaActual(usuarios, transportistas)

  const { hojas, isLoading, mutate } = useHojasRutaDia(
    { empleadoTransportistaId: myTransportista?.id },
    !!myTransportista,
  )
  const { iniciarHojaRuta, isLoading: iniciando } = useIniciarHojaRuta()
  const { finalizarHojaRuta, isLoading: finalizando } = useFinalizarHojaRuta()

  const hoja: HojaRutaDia | undefined = hojas[0]
  const [modalOpen, setModalOpen] = useState(false)
  const [kmFinal, setKmFinal] = useState("")
  const [kmError, setKmError] = useState("")

  // Pendiente -> En proceso la primera vez que se abre la ruta; después solo se vuelve a abrir el mapa
  async function abrirEnGoogleMaps() {
    if (!hoja?.mapsUrl) return
    // La pestaña se abre en el gesto del usuario (si no, el navegador bloquea el popup) y se redirige luego
    const win = window.open("about:blank", "_blank")
    try {
      if (hoja.estado === "Pendiente") {
        await iniciarHojaRuta(hoja.empleadoTransportistaId)
        await mutate()
      }
      if (win) {
        win.opener = null
        win.location.href = hoja.mapsUrl
      } else {
        window.open(hoja.mapsUrl, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      win?.close()
      toast.error(getErrorMessage(error, "No se pudo iniciar la hoja de ruta"))
    }
  }

  function abrirModalFinalizar() {
    setKmFinal("")
    setKmError("")
    setModalOpen(true)
  }

  async function handleFinalizar() {
    if (!hoja?.hojaRuta) return
    const kmInicial = hoja.hojaRuta.kmInicial ?? 0
    if (!kmFinal.trim()) return setKmError("Ingresá el kilometraje final")
    const km = Number(kmFinal)
    if (!Number.isInteger(km) || km < 0) return setKmError("Debe ser un número entero positivo")
    if (km < kmInicial) return setKmError(`No puede ser menor al kilometraje inicial (${formatKm(kmInicial)})`)
    try {
      await finalizarHojaRuta({ id: hoja.hojaRuta.id, kmFinal: km })
      await mutate()
      toast.success("Hoja de ruta finalizada")
      setModalOpen(false)
    } catch (error) {
      setKmError(getErrorMessage(error, "No se pudo finalizar la hoja de ruta"))
    }
  }

  const cargando = loadingUsuarios || loadingTransportistas || (!!myTransportista && isLoading)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Hoja de Ruta</h1>
        <p className="text-sm text-muted-foreground">Tu recorrido de hoy, con todas las paradas en el orden más conveniente.</p>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando tu hoja de ruta…</p>
      ) : !myTransportista ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Todavía no tenés un vehículo asignado. Pedile a un administrador que te asigne uno en &quot;Empleado Transportista&quot;.
        </div>
      ) : !hoja ? (
        <p className="py-4 text-sm italic text-muted-foreground">No tenés pedidos asignados para hoy.</p>
      ) : (
        <HojaRutaCard
          hoja={hoja}
          mostrarTransportista={false}
          actions={
            <>
              <Button
                variant="outline"
                disabled={!hoja.mapsUrl || hoja.estado === "Finalizada" || iniciando}
                onClick={abrirEnGoogleMaps}
              >
                <MapPin className="h-4 w-4" />
                {iniciando ? "Iniciando..." : "Abrir en Google Maps"}
              </Button>
              <Button
                disabled={hoja.estado !== "En proceso"}
                onClick={abrirModalFinalizar}
                title={hoja.estado === "Pendiente" ? "Primero abrí la ruta en Google Maps" : undefined}
              >
                <Flag className="h-4 w-4" />
                Finalizar hoja de ruta
              </Button>
            </>
          }
        />
      )}

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Finalizar hoja de ruta"
        description="Cargá el kilometraje que marca el vehículo al terminar el recorrido."
        onSave={handleFinalizar}
        isLoading={finalizando}
        saveDisabled={!kmFinal.trim()}
        saveLabel="Finalizar"
      >
        {hoja && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {nombreTransportista(hoja)}
            {hoja.vehiculo && <> · <span className="font-mono text-xs">{hoja.vehiculo.patente}</span></>}
            <br />
            Kilometraje inicial:{" "}
            <span className="font-medium text-foreground">
              {hoja.hojaRuta?.kmInicial != null ? formatKm(hoja.hojaRuta.kmInicial) : "—"}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Kilometraje final (km) *</label>
          <Input
            value={kmFinal}
            onChange={(e) => { setKmFinal(e.target.value.replace(/\D/g, "").slice(0, KM_MAX_DIGITS)); setKmError("") }}
            placeholder="Ej: 85120"
            inputMode="numeric"
            className={cn(kmError && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{kmError}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}

export default function HojaRutaPage() {
  const rolNombre = getUser()?.rol?.nombre?.toLowerCase() ?? ""
  return ROLES_VEN_TODAS_LAS_HOJAS.includes(rolNombre) ? <AdminView /> : <TransportistaView />
}
