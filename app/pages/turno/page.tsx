"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useTurnos,
  useCreateTurno,
  useUpdateTurno,
  useDeleteTurno,
  useAsignarEmpleadoTurno,
  useFinalizarTurno,
} from "@/hooks/use-turno"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosTurno } from "@/hooks/use-estado-turno"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import {
  useRegistrosByTurno,
  useCreateRegistroFotografico,
} from "@/hooks/use-registro-fotografico"
import { uploadFoto } from "@/lib/api/client"
import type { Turno, TurnoDetalle } from "@/lib/type/turno"
import type { Donante } from "@/lib/type/donante"
import type { EstadoTurno } from "@/lib/type/estado-turno"
import type { Empleado } from "@/lib/type/user"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { getUser } from "@/lib/auth-utils"
import type { TokenPayload } from "@/lib/auth-utils"
import { formatDateTime } from "@/lib/utils/helpers"

const EMPTY_FORM = { donanteId: "", estadoTurnoId: "", fechaHora: "", descripcion: "" }
const EMPTY_ASIGNAR = { empleadoId: "", empleadoTransportistaId: "" }
const ESTADO_RETIRO_CONFIRMADO = "retiro confirmado"

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DIAS_CAL = ["Lu","Ma","Mi","Ju","Vi"]
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`)

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
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
    current.setDate(current.getDate() + 2)
  }
  return days
}

function isFechaValida(d: Date): boolean {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diaSemana = d.getDay()
  return d >= hoy && diaSemana !== 0 && diaSemana !== 6
}


function EmpleadoAsignadoBadge({ turno }: { turno: Turno }) {
  if (turno.necesitaRetiro) {
    if (!turno.empleadoTransportistaId) return <span className="italic text-muted-foreground">—</span>
    const et = turno.empleadoTransportista
    const nombre = et?.empleado
      ? `${et.empleado.nombre} ${et.empleado.apellido}`
      : `Transportista #${turno.empleadoTransportistaId}`
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        {nombre}
      </span>
    )
  }
  if (!turno.empleadoId) return <span className="italic text-muted-foreground">—</span>
  const nombre = turno.empleado
    ? `${turno.empleado.nombre} ${turno.empleado.apellido}`
    : `Empleado #${turno.empleadoId}`
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      {nombre}
    </span>
  )
}

export default function TurnoPage() {
  const { turnos, isLoading, mutate } = useTurnos()
  const { donantes } = useDonantes()
  const { estadosTurno } = useEstadosTurno()
  const { empleados } = useEmpleadosFull()
  const { transportistas } = useEmpleadosTransportistas()
  const { createTurno, isLoading: isCreating } = useCreateTurno()
  const { updateTurno, isLoading: isUpdating } = useUpdateTurno()
  const { deleteTurno, isLoading: isDeleting } = useDeleteTurno()
  const { asignarEmpleado, isLoading: isAsignando } = useAsignarEmpleadoTurno()
  const { finalizarTurno, isLoading: isFinalizando } = useFinalizarTurno()
  const { createRegistro, isLoading: isCreatingFoto } = useCreateRegistroFotografico()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [asignarModalOpen, setAsignarModalOpen] = useState(false)
  const [finalizarModalOpen, setFinalizarModalOpen] = useState(false)
  const [editing, setEditing] = useState<Turno | null>(null)
  const [asignando, setAsignando] = useState<Turno | null>(null)
  const [finalizando, setFinalizando] = useState<Turno | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [asignarForm, setAsignarForm] = useState(EMPTY_ASIGNAR)
  // Estado para el file input del modal de finalización
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<TokenPayload | null>(null)

  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  useEffect(() => { setUser(getUser()) }, [])

  // Limpia la object URL al cambiar la preview para evitar memory leaks
  useEffect(() => {
    return () => { if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl) }
  }, [fotoPreviewUrl])

  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const isTransportista = user?.rol?.nombre?.toLowerCase() === "transportista"
  const isReadOnly = isDonante || isTransportista

  const myDonante = isDonante
    ? donantes.find((d: Donante) => d.usuarioId === user?.id) ?? null
    : null
  const myTransportista = isTransportista
    ? transportistas.find((et: EmpleadoTransportista) => et.empleado?.usuarioId === user?.id) ?? null
    : null

  const visibleTurnos = isDonante
    ? turnos.filter((t: Turno) => t.donanteId === myDonante?.id)
    : isTransportista
    ? turnos.filter((t: Turno) => t.empleadoTransportistaId === myTransportista?.id)
    : turnos

  const { fotos: fotosDelTurno, isLoading: isLoadingFotos, mutate: mutateFotos } =
    useRegistrosByTurno(finalizarModalOpen ? (finalizando?.id ?? null) : null)

  const columns: TableColumn<Turno>[] = [
    ...(!isReadOnly
      ? [{
          key: "donante",
          header: "Donante",
          cell: (t: Turno) =>
            t.donante?.nombre ?? (
              <span className="italic text-muted-foreground">#{t.donanteId}</span>
            ),
        }]
      : []),
    {
      key: "estado",
      header: "Estado",
      cell: (t) =>
        t.estadoTurno?.descripcion ? (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
            {t.estadoTurno.descripcion}
          </span>
        ) : (
          <span className="italic text-muted-foreground">—</span>
        ),
    },
    {
      key: "retiro",
      header: "Retiro",
      cell: (t) =>
        t.necesitaRetiro ? (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            Sí
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">No</span>
        ),
    },
    {
      key: "empleado",
      header: "Empleado asignado",
      cell: (t) => <EmpleadoAsignadoBadge turno={t} />,
    },
    {
      key: "fechaHora",
      header: "Fecha y hora",
      cell: (t) => (
        <span className="text-muted-foreground">
          {formatDateTime(t.fechaHora) ?? <span className="italic">—</span>}
        </span>
      ),
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-[220px] truncate",
      cell: (t) => (
        <span className="text-muted-foreground">
          {t.descripcion ?? <span className="italic">—</span>}
        </span>
      ),
    },
    ...(isTransportista
      ? [{
          key: "confirmar-retiro",
          header: "",
          cell: (t: Turno) => {
            const estado = t.estadoTurno?.descripcion?.toLowerCase() ?? ""
            if (estado !== "asignado") return null
            return (
              <Button
                size="sm"
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
                onClick={(e) => { e.stopPropagation(); handleConfirmarRetiro(t) }}
              >
                Confirmar retiro
              </Button>
            )
          },
        }]
      : []),
    ...(!isReadOnly
      ? [{
          key: "acciones-extra",
          header: "",
          cell: (t: Turno) => {
            const yaAsignado = !!(t.empleadoId || t.empleadoTransportistaId)
            const estado = t.estadoTurno?.descripcion?.toLowerCase() ?? ""
            const puedeAsignarse = estado === "pendiente" || estado === "asignado"
            const puedeFinalizarse = estado === ESTADO_RETIRO_CONFIRMADO
            return (
              <div className="flex gap-1">
                {puedeAsignarse && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); openAsignar(t) }}
                  >
                    {yaAsignado ? "Reasignar" : "Asignar"}
                  </Button>
                )}
                {puedeFinalizarse && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    onClick={(e) => { e.stopPropagation(); openFinalizar(t) }}
                  >
                    Clasificar
                  </Button>
                )}
              </div>
            )
          },
        }]
      : []),
  ]

  const filtered = visibleTurnos.filter((t: Turno) => {
    const q = search.toLowerCase()
    const donante = t.donante?.nombre?.toLowerCase() ?? ""
    const estado = t.estadoTurno?.descripcion?.toLowerCase() ?? ""
    return (
      donante.includes(q) ||
      estado.includes(q) ||
      (t.descripcion ?? "").toLowerCase().includes(q)
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

  function resetCalendar(fechaHora?: string) {
    const now = new Date()
    if (fechaHora) {
      const d = new Date(fechaHora)
      setCalYear(d.getFullYear())
      setCalMonth(d.getMonth())
      setSelectedDate(d)
      setSelectedTime(`${String(d.getHours()).padStart(2, "0")}:00`)
    } else {
      setCalYear(now.getFullYear())
      setCalMonth(now.getMonth())
      setSelectedDate(null)
      setSelectedTime(null)
    }
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    resetCalendar()
    setModalOpen(true)
  }

  function openEdit(t: Turno) {
    setIsViewing(false)
    setEditing(t)
    setForm({
      donanteId: String(t.donanteId),
      estadoTurnoId: String(t.estadoTurnoId),
      fechaHora: t.fechaHora ? t.fechaHora.slice(0, 16) : "",
      descripcion: t.descripcion ?? "",
    })
    resetCalendar(t.fechaHora ?? undefined)
    setModalOpen(true)
  }

  function openView(t: Turno) {
    setIsViewing(true)
    setEditing(t)
    setForm({
      donanteId: String(t.donanteId),
      estadoTurnoId: String(t.estadoTurnoId),
      fechaHora: t.fechaHora ? t.fechaHora.slice(0, 16) : "",
      descripcion: t.descripcion ?? "",
    })
    resetCalendar(t.fechaHora ?? undefined)
    setModalOpen(true)
  }

  function openAsignar(t: Turno) {
    setAsignando(t)
    setAsignarForm({
      empleadoId: t.empleadoId ? String(t.empleadoId) : "",
      empleadoTransportistaId: t.empleadoTransportistaId ? String(t.empleadoTransportistaId) : "",
    })
    setAsignarModalOpen(true)
  }

  function openFinalizar(t: Turno) {
    setFinalizando(t)
    setSelectedFile(null)
    setFotoPreviewUrl(null)
    setFileInputKey((k) => k + 1)
    setFinalizarModalOpen(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    setSelectedFile(file)
    setFotoPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleSave() {
    if (!form.donanteId || !form.estadoTurnoId || !form.fechaHora) {
      toast.error("Donante, estado y fecha/hora son obligatorios")
      return
    }
    try {
      const payload = {
        donanteId: Number(form.donanteId),
        estadoTurnoId: Number(form.estadoTurnoId),
        fechaHora: form.fechaHora,
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateTurno({ id: editing.id, ...payload })
        toast.success("Turno actualizado")
      } else {
        await createTurno(payload)
        toast.success("Turno creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el turno")
    }
  }

  async function handleAsignar() {
    if (!asignando) return
    const needsRetiro = asignando.necesitaRetiro

    if (needsRetiro && !asignarForm.empleadoTransportistaId) {
      toast.error("Este turno requiere retiro: seleccioná un empleado transportista")
      return
    }
    if (!needsRetiro && !asignarForm.empleadoId) {
      toast.error("Seleccioná un empleado")
      return
    }

    try {
      const payload = needsRetiro
        ? { empleadoTransportistaId: Number(asignarForm.empleadoTransportistaId) }
        : { empleadoId: Number(asignarForm.empleadoId) }

      await asignarEmpleado({ id: asignando.id, ...payload })
      toast.success("Empleado asignado. El turno pasó a estado Asignado.")
      await mutate()
      setAsignarModalOpen(false)
    } catch {
      toast.error("Error al asignar el empleado")
    }
  }

  async function handleAgregarFoto() {
    if (!finalizando || !selectedFile) return
    setIsUploading(true)
    try {
      const url = await uploadFoto(selectedFile)
      await createRegistro({ turnoId: finalizando.id, urlImagen: url })
      setSelectedFile(null)
      setFotoPreviewUrl(null)
      setFileInputKey((k) => k + 1)
      await mutateFotos()
      toast.success("Foto agregada")
    } catch {
      toast.error("Error al subir la foto")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleFinalizar() {
    if (!finalizando) return

    if (fotosDelTurno.length === 0 && !selectedFile) {
      toast.error("Seleccioná al menos una foto de los materiales antes de clasificar")
      return
    }

    setIsUploading(true)
    try {
      if (selectedFile) {
        const url = await uploadFoto(selectedFile)
        await createRegistro({ turnoId: finalizando.id, urlImagen: url })
      }
      await finalizarTurno(finalizando.id)
      toast.success("Turno clasificado correctamente")
      await mutate()
      setFinalizarModalOpen(false)
    } catch (err: any) {
      toast.error(err?.message ?? "Error al clasificar el turno")
    } finally {
      setIsUploading(false)
    }
  }

  async function handleConfirmarRetiro(t: Turno) {
    const estadoObj = estadosTurno.find(
      (e: EstadoTurno) => e.descripcion.toLowerCase() === ESTADO_RETIRO_CONFIRMADO
    )
    if (!estadoObj) {
      toast.error('No se encontró el estado "Retiro Confirmado"')
      return
    }
    try {
      await updateTurno({ id: t.id, estadoTurnoId: Number(estadoObj.id) })
      toast.success("Retiro confirmado")
      await mutate()
    } catch {
      toast.error("Error al confirmar el retiro")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteTurno(Number(id))
      await mutate()
      toast.success("Turno desactivado")
    } catch {
      toast.error("Error al eliminar el turno")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los turnos asignados a donantes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por donante, estado o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} turno{filtered.length !== 1 ? "s" : ""}
        </span>
        {!isReadOnly && (
          <Button className="ml-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo turno
          </Button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando turnos..."
        emptyText="No hay turnos registrados."
        emptySearchText="No se encontraron turnos con ese criterio."
        search={search}
        onView={openView}
        onEdit={isReadOnly ? undefined : openEdit}
        onDelete={isReadOnly ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      {/* Modal crear/editar */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver turno" : editing ? "Editar turno" : "Nuevo turno"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del turno." : "Registrá un nuevo turno para un donante."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear turno"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Donante</label>
          <select
            value={form.donanteId}
            onChange={(e) => setForm((f) => ({ ...f, donanteId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar donante...</option>
            {donantes.map((d: Donante) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Estado</label>
          <select
            value={form.estadoTurnoId}
            onChange={(e) => setForm((f) => ({ ...f, estadoTurnoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar estado...</option>
            {estadosTurno.map((e: EstadoTurno) => (
              <option key={e.id} value={e.id}>{e.descripcion}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha y hora</label>

          {/* Calendario */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="rounded p-1 hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold">
                {MESES_ES[calMonth]} {calYear}
              </span>
              <button type="button" onClick={nextMonth} className="rounded p-1 hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 mb-1">
              {DIAS_CAL.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-y-0.5">
              {getCalendarDays(calYear, calMonth).map((dia, idx) => {
                if (!dia) return <div key={idx} />
                const habilitado = isFechaValida(dia)
                const isSelected = selectedDate ? mismoDia(dia, selectedDate) : false
                const isHoy = mismoDia(dia, new Date())
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
                        : isHoy
                        ? "border border-primary text-primary font-medium"
                        : habilitado
                        ? "hover:bg-muted cursor-pointer"
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
                {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => {
                  const ocupado = slotsOcupados(selectedDate).has(slot) &&
                    !(editing && mismoDia(new Date(editing.fechaHora), selectedDate) &&
                      `${String(new Date(editing.fechaHora).getHours()).padStart(2, "0")}:00` === slot)
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
                  weekday: "long", day: "numeric", month: "long",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="Observaciones del turno..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>

        {/* Materiales del turno */}
        {editing && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-sm font-medium">
              Materiales
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({editing.detalles?.length ?? 0})
              </span>
            </p>
            {!editing.detalles?.length ? (
              <p className="text-sm italic text-muted-foreground">Sin materiales registrados.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Tipo de material</th>
                      <th className="px-3 py-2 text-left font-medium">Descripción</th>
                      <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                      <th className="px-3 py-2 text-left font-medium">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {editing.detalles.map((d: TurnoDetalle) => (
                      <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-medium">
                          {d.tipoMaterial?.nombre ?? `#${d.tipoMaterialId}`}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {d.descripcion ?? <span className="italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {d.cantidadConfirmada ?? <span className="italic text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {d.observaciones ?? <span className="italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </FormModal>

      {/* Modal asignar empleado */}
      {asignando && (
        <FormModal
          open={asignarModalOpen}
          onOpenChange={setAsignarModalOpen}
          title="Asignar empleado al turno"
          description={
            asignando.necesitaRetiro
              ? "Este turno requiere retiro a domicilio. Asigná un empleado transportista."
              : "Asigná un empleado al turno. El estado pasará a Asignado automáticamente."
          }
          onSave={handleAsignar}
          isLoading={isAsignando}
          saveLabel="Confirmar asignación"
        >
          {asignando.necesitaRetiro ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Empleado transportista
                <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  Requiere retiro
                </span>
              </label>
              <select
                value={asignarForm.empleadoTransportistaId}
                onChange={(e) => setAsignarForm((f) => ({ ...f, empleadoTransportistaId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar transportista...</option>
                {transportistas.map((et: EmpleadoTransportista) => {
                  const nombre = et.empleado
                    ? `${et.empleado.nombre} ${et.empleado.apellido}`
                    : `Transportista #${et.id}`
                  return <option key={et.id} value={et.id}>{nombre}</option>
                })}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Empleado</label>
              <select
                value={asignarForm.empleadoId}
                onChange={(e) => setAsignarForm((f) => ({ ...f, empleadoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar empleado...</option>
                {empleados
                .filter((emp: Empleado) => {
                  const rol = emp.rol?.nombre?.toLowerCase() ?? ""
                  return rol === "transportista" || rol === "administrativo"
                })
                .map((emp: Empleado) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}{emp.cargo ? ` — ${emp.cargo}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </FormModal>
      )}

      {/* Modal finalizar turno */}
      {finalizando && (
        <FormModal
          open={finalizarModalOpen}
          onOpenChange={(open) => {
            setFinalizarModalOpen(open)
            if (!open) { setFinalizando(null); setSelectedFile(null); setFotoPreviewUrl(null) }
          }}
          title="Clasificar turno"
          description="Para clasificar el turno debe haber al menos una foto de los materiales."
          onSave={handleFinalizar}
          isLoading={isFinalizando || isCreatingFoto || isUploading}
          saveLabel="Clasificar"
        >
          {/* Fotos ya registradas */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              Fotos registradas
              {!isLoadingFotos && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({fotosDelTurno.length})
                </span>
              )}
            </p>
            {isLoadingFotos ? (
              <p className="text-sm text-muted-foreground">Cargando fotos...</p>
            ) : fotosDelTurno.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fotosDelTurno.map((f) => (
                  <a key={f.id} href={f.urlImagen} target="_blank" rel="noopener noreferrer">
                    <img
                      src={f.urlImagen}
                      alt={`Foto ${f.id}`}
                      className="h-20 w-20 rounded-md object-cover border border-border hover:opacity-80 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No hay fotos registradas aún.</p>
            )}
          </div>

          {/* Agregar foto */}
          <div className="flex flex-col gap-2 border-t pt-4">
            <label className="text-sm font-medium">
              {fotosDelTurno.length > 0 ? "Agregar otra foto" : "Subir foto"}
              {fotosDelTurno.length === 0 && <span className="ml-1 text-destructive">*</span>}
              <span className="ml-1 text-xs text-muted-foreground font-normal">(jpg, jpeg, png, webp — máx. 5 MB)</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                key={fileInputKey}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="flex-1 text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium file:cursor-pointer cursor-pointer"
              />
              {selectedFile && fotosDelTurno.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading || isCreatingFoto}
                  onClick={handleAgregarFoto}
                >
                  Agregar
                </Button>
              )}
            </div>
            {fotoPreviewUrl && (
              <img
                src={fotoPreviewUrl}
                alt="Vista previa"
                className="h-32 w-auto rounded-md object-contain border border-border"
              />
            )}
          </div>
        </FormModal>
      )}
    </div>
  )
}
