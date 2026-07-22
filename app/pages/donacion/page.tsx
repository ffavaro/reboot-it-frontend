"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Truck, Building2, AlertTriangle } from "lucide-react"
import type { TokenPayload } from "@/lib/auth-utils"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormModal } from "@/components/ui/form-modal"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import {
  useDonaciones,
  useCreateDonacion,
  useUpdateDonacion,
  useDeleteDonacion,
} from "@/hooks/use-donacion"
import { useDonantes } from "@/hooks/use-donantes"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { useTurnos } from "@/hooks/use-turno"
import type { Donacion, EstadoDonacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { Turno } from "@/lib/type/turno"
import { getUser } from "@/lib/auth-utils"

const EMPTY_FORM = { donanteId: "", fechaHora: "", estadoDonacionId: "", descripcion: "" }
const EMPTY_DETALLE = { tipoMaterialId: "", descripcion: "", cantidadEstimada: "", observaciones: "" }
type DetalleRow = typeof EMPTY_DETALLE

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DIAS_CAL = ["Lu", "Ma", "Mi", "Ju", "Vi"]
const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`)

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  "en proceso": "bg-blue-100 text-blue-800",
  completada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const dow = firstDay.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const current = new Date(year, month, 1 - daysFromMonday)
  const days: (Date | null)[] = []
  while (current <= lastDay) {
    for (let i = 0; i < 5; i++) {
      days.push(current.getMonth() === month ? new Date(current) : null)
      current.setDate(current.getDate() + 1)
    }
    current.setDate(current.getDate() + 2) // salta sáb + dom
  }
  return days
}

function getMinSelectableDate(): Date {
  const now = new Date()
  const minDate = new Date(now)
  minDate.setHours(0, 0, 0, 0)
  // El día actual nunca se puede elegir; si ya pasaron las 17hs, se corre
  // un día más para dar margen de coordinación con el equipo de retiro.
  minDate.setDate(minDate.getDate() + (now.getHours() >= 17 ? 2 : 1))
  return minDate
}

function getEarliestValidDate(): Date {
  const d = getMinSelectableDate()
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

function isFechaValida(d: Date): boolean {
  const minDate = getMinSelectableDate()
  const diaSemana = d.getDay()
  return d >= minDate && diaSemana !== 0 && diaSemana !== 6
}

export default function DonacionPage() {
  const { donaciones, isLoading, mutate } = useDonaciones()
  const { donantes } = useDonantes()
  const { tipoMateriales } = useTipoMateriales()
  const { estadosDonacion } = useEstadosDonacion()
  const { turnos } = useTurnos()
  const { createDonacion, isLoading: isCreating } = useCreateDonacion()
  const { updateDonacion, isLoading: isUpdating } = useUpdateDonacion()
  const { deleteDonacion, isLoading: isDeleting } = useDeleteDonacion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Donacion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [detalles, setDetalles] = useState<DetalleRow[]>([])
  const [user, setUser] = useState<TokenPayload | null>(null)

  const [necesitaRetiro, setNecesitaRetiro] = useState(false)
  const [usarOtraDireccion, setUsarOtraDireccion] = useState(false)
  const [direccionRetiro, setDireccionRetiro] = useState("")

  const [calYear, setCalYear] = useState(0)
  const [calMonth, setCalMonth] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  useEffect(() => {
    setUser(getUser())
    const now = new Date()
    setCalYear(now.getFullYear())
    setCalMonth(now.getMonth())
  }, [])

  const myDonante = user
    ? donantes.find((d: Donante) => d.usuarioId === user.id) ?? null
    : null
  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante" || myDonante !== null

  const visibleDonaciones = isDonante && myDonante
    ? donaciones.filter((d: Donacion) => d.donanteId === myDonante.id)
    : isDonante
    ? []
    : donaciones

  const filtered = visibleDonaciones.filter((d: Donacion) => {
    const q = search.toLowerCase()
    return (
      (d.donante?.nombre ?? "").toLowerCase().includes(q) ||
      (d.estadoDonacion?.descripcion ?? "").toLowerCase().includes(q) ||
      (d.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function slotsOcupados(dia: Date): Set<string> {
    const ocupados = new Set<string>()
    turnos
      .filter((t: Turno) => t.isActive && mismoDia(new Date(t.fechaHora), dia))
      .forEach((t: Turno) => {
        const d = new Date(t.fechaHora)
        ocupados.add(`${String(d.getHours()).padStart(2, "0")}:00`)
      })
    return ocupados
  }

  function turnosEnDia(dia: Date): number {
    return turnos.filter((t: Turno) => t.isActive && mismoDia(new Date(t.fechaHora), dia)).length
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11) }
    else setCalMonth((m) => m - 1)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0) }
    else setCalMonth((m) => m + 1)
  }

  function handleSelectDate(dia: Date) {
    setSelectedDate(dia)
    setSelectedTime(null)
    setForm((f) => ({ ...f, fechaHora: "" }))
  }

  function handleSelectTime(slot: string) {
    setSelectedTime(slot)
    if (selectedDate) {
      const [h, m] = slot.split(":").map(Number)
      const d = new Date(selectedDate)
      d.setHours(h, m, 0, 0)
      const pad = (n: number) => String(n).padStart(2, "0")
      setForm((f) => ({
        ...f,
        fechaHora: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`,
      }))
    }
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    const estadoPendiente = estadosDonacion.find((e: EstadoDonacion) =>
      e.descripcion.toLowerCase().includes("pendiente")
    )
    const earliest = getEarliestValidDate()
    setCalYear(earliest.getFullYear())
    setCalMonth(earliest.getMonth())
    setSelectedDate(earliest)
    setSelectedTime(null)
    setNecesitaRetiro(false)
    setUsarOtraDireccion(false)
    setDireccionRetiro("")
    setForm({
      ...EMPTY_FORM,
      donanteId: myDonante ? String(myDonante.id) : "",
      estadoDonacionId: estadoPendiente ? String(estadoPendiente.id) : "",
    })
    setDetalles([])
    setSheetOpen(true)
  }

  function openEdit(d: Donacion) {
    setIsViewing(false)
    setEditing(d)
    setSelectedDate(null)
    setSelectedTime(null)
    setNecesitaRetiro(d.necesitaRetiro ?? false)
    setUsarOtraDireccion(!!d.direccionRetiro)
    setDireccionRetiro(d.direccionRetiro ?? "")
    setForm({
      donanteId: String(d.donanteId),
      fechaHora: "",
      estadoDonacionId: d.estadoDonacionId != null ? String(d.estadoDonacionId) : "",
      descripcion: d.descripcion ?? "",
    })
    setDetalles(
      (d.detalles ?? []).map((det) => ({
        tipoMaterialId: String(det.tipoMaterialId),
        descripcion: det.descripcion ?? "",
        cantidadEstimada: det.cantidadEstimada != null ? String(det.cantidadEstimada) : "",
        observaciones: det.observaciones ?? "",
      })),
    )
    setSheetOpen(true)
  }

  function openView(d: Donacion) {
    setIsViewing(true)
    setEditing(d)
    setSelectedDate(null)
    setSelectedTime(null)
    setNecesitaRetiro(d.necesitaRetiro ?? false)
    setUsarOtraDireccion(!!d.direccionRetiro)
    setDireccionRetiro(d.direccionRetiro ?? "")
    setForm({
      donanteId: String(d.donanteId),
      fechaHora: "",
      estadoDonacionId: d.estadoDonacionId != null ? String(d.estadoDonacionId) : "",
      descripcion: d.descripcion ?? "",
    })
    setDetalles(
      (d.detalles ?? []).map((det) => ({
        tipoMaterialId: String(det.tipoMaterialId),
        descripcion: det.descripcion ?? "",
        cantidadEstimada: det.cantidadEstimada != null ? String(det.cantidadEstimada) : "",
        observaciones: det.observaciones ?? "",
      })),
    )
    setSheetOpen(true)
  }

  function addDetalle() {
    setDetalles((prev) => [...prev, { ...EMPTY_DETALLE }])
  }

  function removeDetalle(idx: number) {
    setDetalles((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateDetalleField(idx: number, field: keyof DetalleRow, value: string) {
    setDetalles((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))
  }

  async function handleSave() {
    if (!form.donanteId) {
      toast.error("El donante es obligatorio")
      return
    }
    if (!editing && !form.fechaHora) {
      toast.error("Seleccioná una fecha y horario para el turno")
      return
    }
    if (detalles.length === 0) {
      toast.error("Agregá al menos un material a la donación")
      return
    }
    if (detalles.some((d) => !d.tipoMaterialId)) {
      toast.error("Seleccioná el tipo de material para cada ítem")
      return
    }
    if (necesitaRetiro && usarOtraDireccion && !direccionRetiro.trim()) {
      toast.error("Ingresá la dirección donde se realizará el retiro")
      return
    }

    const detallesPayload = detalles.map((d) => ({
      tipoMaterialId: Number(d.tipoMaterialId),
      descripcion: d.descripcion.trim() || undefined,
      cantidadEstimada: d.cantidadEstimada ? Number(d.cantidadEstimada) : undefined,
      observaciones: d.observaciones.trim() || undefined,
    }))

    const direccionRetiroPayload =
      necesitaRetiro && usarOtraDireccion ? direccionRetiro.trim() : undefined

    try {
      if (editing) {
        await updateDonacion({
          id: editing.id,
          donanteId: Number(form.donanteId),
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          necesitaRetiro,
          direccionRetiro: necesitaRetiro ? (direccionRetiroPayload ?? null) : null,
          descripcion: form.descripcion.trim() || undefined,
          detalles: detallesPayload,
        })
        toast.success("Donación actualizada")
      } else {
        await createDonacion({
          donanteId: Number(form.donanteId),
          fechaHora: form.fechaHora,
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          necesitaRetiro,
          direccionRetiro: direccionRetiroPayload,
          descripcion: form.descripcion.trim() || undefined,
          detalles: detallesPayload,
        })
        toast.success("Donación creada y turno generado")
      }
      await mutate()
      setSheetOpen(false)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      toast.error(msg ?? "Error al guardar la donación")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteDonacion(Number(id))
      await mutate()
      toast.success("Donación desactivada")
    } catch {
      toast.error("Error al eliminar la donación")
    }
  }

  const columns: TableColumn<Donacion>[] = [
    {
      key: "id",
      header: "ID",
      cell: (d) => `#${d.id}`,
      className: "font-mono text-xs w-14",
    },
    ...(!isDonante
      ? [
          {
            key: "donante",
            header: "Donante",
            cell: (d: Donacion) =>
              d.donante?.nombre ?? (
                <span className="italic text-muted-foreground">#{d.donanteId}</span>
              ),
          },
        ]
      : []),
    {
      key: "estado",
      header: "Estado",
      cell: (d) => {
        const desc = d.estadoDonacion?.descripcion
        if (!desc) return <span className="italic text-muted-foreground">—</span>
        const color = ESTADO_COLORS[desc.toLowerCase()] ?? "bg-gray-100 text-gray-800"
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
            {desc}
          </span>
        )
      },
      className: "w-32",
    },
    {
      key: "items",
      header: "Materiales",
      cell: (d) => (
        <span className="text-sm text-muted-foreground">
          {d.detalles?.length ?? 0} ítem{(d.detalles?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      ),
      className: "w-24",
    },
    {
      key: "retiro",
      header: "Entrega",
      cell: (d) =>
        d.necesitaRetiro ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            <Truck className="h-3 w-3" /> Retiro
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
            <Building2 className="h-3 w-3" /> Sucursal
          </span>
        ),
      className: "w-28",
    },
    {
      key: "descripcion",
      header: "Descripción",
      cell: (d) =>
        d.descripcion ?? <span className="italic text-muted-foreground">—</span>,
      className: "max-w-[220px] truncate text-muted-foreground",
    },
  ]

  const calDays = getCalendarDays(calYear, calMonth)
  const hoy = new Date()
  const donanteSeleccionado = donantes.find((d: Donante) => String(d.id) === form.donanteId) ?? null

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Donaciones</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las donaciones y los materiales asociados.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por donante, estado o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} donación{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva donación
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando donaciones..."
        emptyText="No hay donaciones registradas."
        emptySearchText="No se encontraron donaciones con ese criterio."
        search={search}
        onView={openView}
        onEdit={isDonante ? undefined : openEdit}
        onDelete={isDonante ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={isViewing ? "Ver donación" : editing ? "Editar donación" : "Nueva donación"}
        readOnly={isViewing}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear donación"}
      >
        <div className="flex flex-col gap-5">

          {/* Donante */}
          {!isDonante && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Donante *</label>
              <select
                value={form.donanteId}
                onChange={(e) => setForm((f) => ({ ...f, donanteId: e.target.value }))}
                disabled={!!editing}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar donante...</option>
                {donantes.map((d: Donante) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}{d.razonSocial ? ` — ${d.razonSocial}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fecha del turno — solo en creación */}
          {!editing && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Fecha del turno *</label>

              {/* Calendario */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="rounded p-1 hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold">
                    {MESES_ES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="rounded p-1 hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-5 mb-1">
                  {DIAS_CAL.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-y-0.5">
                  {calDays.map((dia, idx) => {
                    if (!dia) return <div key={idx} />
                    const habilitado = isFechaValida(dia)
                    const isSelected = selectedDate ? mismoDia(dia, selectedDate) : false
                    const isHoy = mismoDia(dia, hoy)
                    const cantTurnos = turnosEnDia(dia)
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!habilitado}
                        onClick={() => handleSelectDate(dia)}
                        className={[
                          "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : habilitado
                            ? "hover:bg-muted cursor-pointer"
                            : isHoy
                            ? "opacity-40 cursor-not-allowed border border-primary/50 text-primary/70"
                            : "opacity-25 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {dia.getDate()}
                        {cantTurnos > 0 && !isSelected && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary/50" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  El punto indica días con turnos ya registrados.
                </p>
              </div>

              {/* Horarios disponibles */}
              {selectedDate && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Horarios —{" "}
                    {selectedDate.toLocaleDateString("es-AR", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TIME_SLOTS.map((slot) => {
                      const ocupado = slotsOcupados(selectedDate).has(slot)
                      const activo = selectedTime === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={ocupado}
                          onClick={() => handleSelectTime(slot)}
                          className={[
                            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                            activo
                              ? "bg-primary text-primary-foreground"
                              : ocupado
                              ? "bg-muted/40 text-muted-foreground line-through cursor-not-allowed"
                              : "bg-muted hover:bg-muted/70 cursor-pointer",
                          ].join(" ")}
                        >
                          {slot}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {form.fechaHora && (
                <p className="text-xs text-muted-foreground">
                  Turno:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(form.fechaHora).toLocaleString("es-AR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Estado — solo visible al editar */}
          {!!editing && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={form.estadoDonacionId}
                onChange={(e) => setForm((f) => ({ ...f, estadoDonacionId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin estado</option>
                {estadosDonacion.map((e: EstadoDonacion) => (
                  <option key={e.id} value={e.id}>{e.descripcion}</option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Descripción general de la donación..."
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Modalidad de entrega */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">¿Cómo entregás los materiales? *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNecesitaRetiro(false)}
                className={[
                  "flex items-center gap-2.5 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                  !necesitaRetiro
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50",
                ].join(" ")}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Lo llevo a la sucursal</span>
              </button>
              <button
                type="button"
                onClick={() => setNecesitaRetiro(true)}
                className={[
                  "flex items-center gap-2.5 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
                  necesitaRetiro
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50",
                ].join(" ")}
              >
                <Truck className="h-4 w-4 shrink-0" />
                <span>Necesito retiro a domicilio</span>
              </button>
            </div>
            {necesitaRetiro && (
              <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs text-orange-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  El servicio de retiro a domicilio tiene un <strong>costo adicional</strong> que será coordinado con el equipo de Reboot IT.
                </span>
              </div>
            )}

            {necesitaRetiro && (
              <div className="flex flex-col gap-2 rounded-md border px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Dirección registrada:{" "}
                  <span className="font-medium text-foreground">
                    {donanteSeleccionado?.direccion ?? "Sin dirección registrada"}
                  </span>
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={usarOtraDireccion}
                    onChange={(e) => setUsarOtraDireccion(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Retirar en una dirección distinta a la registrada
                </label>
                {usarOtraDireccion && (
                  <Input
                    placeholder="Dirección donde se realizará el retiro"
                    value={direccionRetiro}
                    onChange={(e) => setDireccionRetiro(e.target.value)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Materiales — tabla */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Materiales a donar *</span>
              <Button variant="outline" size="sm" type="button" onClick={addDetalle}>
                + Agregar
              </Button>
            </div>

            {detalles.length === 0 ? (
              <p className="text-sm italic text-muted-foreground py-1">Sin materiales cargados. Agregá al menos uno.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Tipo de material *
                      </th>
                      <th className="w-20 px-3 py-2 text-left font-medium text-muted-foreground">
                        Cant.
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Descripción
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                        Observaciones
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((det, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-2 py-1.5">
                          <select
                            value={det.tipoMaterialId}
                            onChange={(e) => updateDetalleField(idx, "tipoMaterialId", e.target.value)}
                            className="h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="">Seleccionar...</option>
                            {tipoMateriales.map((t: TipoMaterial) => (
                              <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={1}
                            placeholder="—"
                            value={det.cantidadEstimada}
                            onChange={(e) => updateDetalleField(idx, "cantidadEstimada", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            placeholder="(opcional)"
                            value={det.descripcion}
                            onChange={(e) => updateDetalleField(idx, "descripcion", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            placeholder="(opcional)"
                            value={det.observaciones}
                            onChange={(e) => updateDetalleField(idx, "observaciones", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeDetalle(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors text-base leading-none"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </FormModal>
    </div>
  )
}
