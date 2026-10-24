"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Truck, Building2, AlertTriangle, Plus, CheckCircle2, ImagePlus, X } from "lucide-react"
import type { TokenPayload } from "@/lib/auth-utils"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { FormModal } from "@/components/ui/form-modal"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { uploadFoto } from "@/lib/api/client"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import {
  useDonaciones,
  useCreateDonacion,
  useUpdateDonacion,
  useDeleteDonacion,
} from "@/hooks/use-donacion"
import { useDonantes } from "@/hooks/use-donantes"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { useTurnos } from "@/hooks/use-turno"
import type { Donacion, EstadoDonacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"
import type { Turno } from "@/lib/type/turno"
import { getUser } from "@/lib/auth-utils"
import { GenerarCertificadoModal } from "@/components/generar-certificado-modal"
import { DetalleDonacionDialog } from "@/components/detalle-donacion-dialog"
import { enforceDecimalInput } from "@/lib/utils/number-limit"
import { formatPeso, getErrorMessage } from "@/lib/utils/helpers"
import { CONDICION_MATERIAL, ESTADO_DONACION, esCondicion } from "@/lib/constants/estados"

const EMPTY_FORM = { donanteId: "", fechaHora: "", estadoDonacionId: "", descripcion: "" }
const EMPTY_DETALLE = { tipoMaterialId: "", condicionMaterialId: "", cantidadEstimada: "" }
type DetalleRow = typeof EMPTY_DETALLE
const PESO_ESTIMADO_MAX_DIGITS = 7
const CANTIDAD_MAX_DIGITS = 6

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DIAS_CAL = ["Lu", "Ma", "Mi", "Ju", "Vi"]
// Horario de atención de la empresa: turnos de lunes a viernes, de 08:00 a 17:00
const HORA_APERTURA = 8
const HORA_CIERRE = 17
const TIME_SLOTS = Array.from({ length: HORA_CIERRE - HORA_APERTURA + 1 }, (_, i) => `${String(HORA_APERTURA + i).padStart(2, "0")}:00`)
const MAX_FOTOS = 5
const MAX_FOTO_MB = 5

// ¿Ese horario del día ya pasó? (solo puede pasar en el día de hoy)
function slotPasado(dia: Date, slot: string, ahora = new Date()): boolean {
  const [h, m] = slot.split(":").map(Number)
  const d = new Date(dia)
  d.setHours(h, m, 0, 0)
  return d.getTime() <= ahora.getTime()
}

// Hoy se puede pedir turno mientras quede algún horario dentro del horario de atención
function quedanHorariosHoy(ahora = new Date()): boolean {
  return TIME_SLOTS.some((slot) => !slotPasado(ahora, slot, ahora))
}

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
  // Se puede elegir el día de hoy; si ya terminó el horario de atención, al seleccionarlo se avisa que elija otro día
  const minDate = new Date()
  minDate.setHours(0, 0, 0, 0)
  return minDate
}

// Primer día sugerido: hoy si todavía quedan horarios, si no el próximo día hábil
function getEarliestValidDate(): Date {
  const d = getMinSelectableDate()
  if (!quedanHorariosHoy()) d.setDate(d.getDate() + 1)
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
  const { condiciones } = useCondicionesMaterial()
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
  const [pesoEstimadoKg, setPesoEstimadoKg] = useState("")

  // Fotos opcionales de los materiales (solo al crear): archivo y vista previa
  const [fotos, setFotos] = useState<{ file: File; url: string }[]>([])
  const [subiendoFotos, setSubiendoFotos] = useState(false)
  // Tarjeta de confirmación del turno, con los datos cargados
  const [confirmacion, setConfirmacion] = useState<{
    donacionId: number
    turnoId?: number
    donante: string
    fechaHora: string
    modalidad: string
    direccion: string | null
    pesoKg: string | null
    materiales: { nombre: string; cantidad: string }[]
    cantFotos: number
  } | null>(null)

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
  // "Generar Certificado": solo lo ve el Administrativo
  const esAdministrativo = user?.rol?.nombre?.trim().toLowerCase() === "administrativo"
  const [certDonacion, setCertDonacion] = useState<Donacion | null>(null)
  // Detalle de trazabilidad (el ojo de la grilla)
  const [detalleId, setDetalleId] = useState<number | null>(null)

  // Condición por defecto de todo material cargado: se define recién al clasificarlo
  const condicionADefinir = condiciones.find(
    (c: CondicionMaterial) => esCondicion(c.condicion, CONDICION_MATERIAL.A_DEFINIR),
  )

  const visibleDonaciones = isDonante && myDonante
    ? donaciones.filter((d: Donacion) => d.donanteId === myDonante.id)
    : isDonante
    ? []
    : donaciones

  // La última donación cargada va primero
  const filtered = visibleDonaciones.filter((d: Donacion) => {
    const q = search.toLowerCase()
    return (
      (d.donante?.nombre ?? "").toLowerCase().includes(q) ||
      (d.estadoDonacion?.descripcion ?? "").toLowerCase().includes(q) ||
      (d.descripcion ?? "").toLowerCase().includes(q)
    )
  }).sort((a: Donacion, b: Donacion) => b.id - a.id)

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

  function limpiarFotos() {
    fotos.forEach((f) => URL.revokeObjectURL(f.url))
    setFotos([])
  }

  function agregarFotos(lista: FileList | null) {
    if (!lista) return
    const nuevas: { file: File; url: string }[] = []
    for (const file of Array.from(lista)) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        toast.error("Las fotos deben ser imágenes JPG, PNG o WEBP")
        continue
      }
      if (file.size > MAX_FOTO_MB * 1024 * 1024) {
        toast.error(`Cada foto puede pesar hasta ${MAX_FOTO_MB} MB`)
        continue
      }
      if (fotos.length + nuevas.length >= MAX_FOTOS) {
        toast.error(`Podés cargar hasta ${MAX_FOTOS} fotos`)
        break
      }
      nuevas.push({ file, url: URL.createObjectURL(file) })
    }
    if (nuevas.length) setFotos((prev) => [...prev, ...nuevas])
  }

  function quitarFoto(url: string) {
    URL.revokeObjectURL(url)
    setFotos((prev) => prev.filter((f) => f.url !== url))
  }

  function handleSelectDate(dia: Date) {
    // Hoy fuera del horario de atención: no se puede pedir turno
    if (mismoDia(dia, new Date()) && !quedanHorariosHoy()) {
      toast.warning(`El horario de atención de hoy ya terminó (${String(HORA_APERTURA).padStart(2, "0")}:00 a ${HORA_CIERRE}:00 hs). Seleccioná otro día.`, { toastId: "fuera-de-horario" })
      return
    }
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
    setPesoEstimadoKg("")
    setForm({
      ...EMPTY_FORM,
      donanteId: myDonante ? String(myDonante.id) : "",
      estadoDonacionId: estadoPendiente ? String(estadoPendiente.id) : "",
    })
    setDetalles([])
    limpiarFotos()
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
    setPesoEstimadoKg(formatPeso(d.pesoEstimadoKg))
    setForm({
      donanteId: String(d.donanteId),
      fechaHora: "",
      estadoDonacionId: d.estadoDonacionId != null ? String(d.estadoDonacionId) : "",
      descripcion: d.descripcion ?? "",
    })
    setDetalles(
      (d.detalles ?? []).map((det) => ({
        tipoMaterialId: String(det.tipoMaterialId),
        condicionMaterialId: det.condicionMaterialId != null ? String(det.condicionMaterialId) : "",
        cantidadEstimada: det.cantidadEstimada != null ? String(det.cantidadEstimada) : "",
      })),
    )
    setSheetOpen(true)
  }

  function addDetalle() {
    setDetalles((prev) => [
      ...prev,
      { ...EMPTY_DETALLE, condicionMaterialId: condicionADefinir ? String(condicionADefinir.id) : "" },
    ])
  }

  function removeDetalle(idx: number) {
    setDetalles((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateDetalleField(idx: number, field: keyof DetalleRow, value: string) {
    setDetalles((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))
  }

  // La cantidad son unidades: solo dígitos, sin coma, punto ni signo
  function updateCantidad(idx: number, value: string) {
    const soloDigitos = value.replace(/[^0-9]/g, "").slice(0, CANTIDAD_MAX_DIGITS)
    if (soloDigitos !== value) {
      toast.error("La cantidad debe ser un número entero, sin coma ni punto", { toastId: "cantidad-entera" })
    }
    updateDetalleField(idx, "cantidadEstimada", soloDigitos)
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
    if (detalles.some((d) => d.cantidadEstimada !== "" && !/^[1-9][0-9]*$/.test(d.cantidadEstimada))) {
      toast.error("La cantidad de cada material debe ser un número entero mayor a 0")
      return
    }
    if (detalles.some((d) => !d.condicionMaterialId) && !condicionADefinir) {
      toast.error("No se pudo determinar la condición del material. Recargá la página e intentá de nuevo")
      return
    }
    if (necesitaRetiro && usarOtraDireccion && !direccionRetiro.trim()) {
      toast.error("Ingresá la dirección donde se realizará el retiro")
      return
    }
    if (necesitaRetiro && !pesoEstimadoKg.trim()) {
      toast.error("Ingresá el peso estimado de la donación para el retiro")
      return
    }

    const detallesPayload = detalles.map((d) => ({
      tipoMaterialId: Number(d.tipoMaterialId),
      condicionMaterialId: Number(d.condicionMaterialId || condicionADefinir?.id),
      cantidadEstimada: d.cantidadEstimada ? Number(d.cantidadEstimada) : undefined,
    }))

    const direccionRetiroPayload =
      necesitaRetiro && usarOtraDireccion ? direccionRetiro.trim() : undefined
    const pesoEstimadoPayload =
      necesitaRetiro && pesoEstimadoKg !== "" ? Number(pesoEstimadoKg) : undefined

    try {
      if (editing) {
        await updateDonacion({
          id: editing.id,
          donanteId: Number(form.donanteId),
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          necesitaRetiro,
          direccionRetiro: necesitaRetiro ? (direccionRetiroPayload ?? null) : null,
          pesoEstimadoKg: necesitaRetiro ? (pesoEstimadoPayload ?? null) : null,
          descripcion: form.descripcion.trim() || undefined,
          detalles: detallesPayload,
        })
        toast.success("Donación actualizada")
      } else {
        let fotosUrls: string[] = []
        if (fotos.length) {
          setSubiendoFotos(true)
          try {
            fotosUrls = await Promise.all(fotos.map((f) => uploadFoto(f.file)))
          } catch (err) {
            toast.error(getErrorMessage(err, "No se pudieron subir las fotos. Probá de nuevo o quitalas para continuar."))
            return
          } finally {
            setSubiendoFotos(false)
          }
        }
        const donanteElegido = donantes.find((d: Donante) => String(d.id) === form.donanteId)
        const creada = await createDonacion({
          donanteId: Number(form.donanteId),
          fechaHora: form.fechaHora,
          estadoDonacionId: form.estadoDonacionId ? Number(form.estadoDonacionId) : undefined,
          necesitaRetiro,
          direccionRetiro: direccionRetiroPayload,
          pesoEstimadoKg: pesoEstimadoPayload,
          descripcion: form.descripcion.trim() || undefined,
          fotosUrls: fotosUrls.length ? fotosUrls : undefined,
          detalles: detallesPayload,
        })
        toast.success("Donación creada y turno generado")
        setConfirmacion({
          donacionId: creada.id,
          turnoId: creada.turno?.id,
          donante: donanteElegido?.nombre ?? "—",
          fechaHora: creada.turno?.fechaHora ?? form.fechaHora,
          modalidad: necesitaRetiro ? "Retiro a domicilio" : "Lo lleva a la sucursal",
          direccion: necesitaRetiro ? (direccionRetiroPayload ?? donanteElegido?.direccion ?? null) : null,
          pesoKg: necesitaRetiro && pesoEstimadoPayload !== undefined ? String(pesoEstimadoPayload) : null,
          materiales: detalles.map((d) => ({
            nombre: tipoMateriales.find((t: TipoMaterial) => String(t.id) === d.tipoMaterialId)?.nombre ?? "Material",
            cantidad: d.cantidadEstimada || "—",
          })),
          cantFotos: fotosUrls.length,
        })
        limpiarFotos()
      }
      await mutate()
      setSheetOpen(false)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al guardar la donación"))
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
      header: "N°",
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
    ...(esAdministrativo
      ? [{
          key: "certificado",
          header: "",
          cell: (d: Donacion) =>
            d.estadoDonacion?.descripcion?.toLowerCase() === ESTADO_DONACION.PENDIENTE_CERTIFICADO.toLowerCase() ? (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={(e) => { e.stopPropagation(); setCertDonacion(d) }}
              >
                Generar Certificado
              </Button>
            ) : null,
        }]
      : []),
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

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por donante, estado o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} donación{filtered.length !== 1 ? "es" : ""}
        </span>
        <CrearButton className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva donación
        </CrearButton>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando donaciones..."
        emptyText="No hay donaciones registradas."
        emptySearchText="No se encontraron donaciones con ese criterio."
        search={search}
        onView={(d) => setDetalleId(d.id)}
        onEdit={isDonante ? undefined : openEdit}
        onDelete={isDonante ? undefined : handleDelete}
        isDeleting={isDeleting}
      />

      <DetalleDonacionDialog donacionId={detalleId} onClose={() => setDetalleId(null)} />
      <GenerarCertificadoModal donacion={certDonacion} onClose={() => setCertDonacion(null)} onGenerado={async () => { await mutate() }} />

      <FormModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={isViewing ? "Ver donación" : "Gestionar donación"}
        readOnly={isViewing}
        onSave={handleSave}
        isLoading={isCreating || isUpdating || subiendoFotos}
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
                  El punto indica días con turnos ya registrados. Podés pedir turno para hoy, dentro del horario de atención ({String(HORA_APERTURA).padStart(2, "0")}:00 a {HORA_CIERRE}:00 hs).
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
                      const ocupado = slotsOcupados(selectedDate).has(slot) || slotPasado(selectedDate, slot)
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
                        Condición del material
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
                            inputMode="numeric"
                            placeholder="—"
                            value={det.cantidadEstimada}
                            onChange={(e) => updateCantidad(idx, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={det.condicionMaterialId}
                            disabled
                            className="h-8 w-full rounded-md border border-input bg-muted px-2 py-1 text-xs shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {condiciones.map((c: CondicionMaterial) => (
                              <option key={c.id} value={c.id}>{c.condicion}</option>
                            ))}
                          </select>
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

          {/* Fotos de los materiales (opcional, solo al crear) */}
          {!editing && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Fotos de los materiales <span className="text-muted-foreground font-normal">(opcional, hasta {MAX_FOTOS})</span>
                </span>
                {fotos.length < MAX_FOTOS && (
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    <ImagePlus className="h-3.5 w-3.5" />
                    Agregar fotos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => { agregarFotos(e.target.files); e.target.value = "" }}
                    />
                  </label>
                )}
              </div>
              {fotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fotos.map((f) => (
                    <div key={f.url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt="Foto de los materiales" className="h-20 w-20 rounded-md border border-border object-cover" />
                      <button
                        type="button"
                        onClick={() => quitarFoto(f.url)}
                        aria-label="Quitar foto"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">Quedan asociadas al retiro de esta donación para que el equipo vea el estado de los materiales.</p>
            </div>
          )}

          {/* Peso estimado: se pide al final, con todos los materiales ya cargados */}
          {necesitaRetiro && (
            <div className="flex flex-col gap-1.5 rounded-md border px-3 py-2.5">
              <label className="text-sm font-medium">
                Peso estimado de la donación (kg) *
              </label>
              <Input
                inputMode="decimal"
                placeholder="Ej: 25.50"
                value={pesoEstimadoKg}
                onChange={(e) => setPesoEstimadoKg(enforceDecimalInput(e.target.value, PESO_ESTIMADO_MAX_DIGITS, "El peso estimado"))}
              />
              <p className="text-[11px] text-muted-foreground">
                Se usa para asignar un transportista cuyo vehículo soporte esta carga.
              </p>
            </div>
          )}

        </div>
      </FormModal>

      {/* Confirmación del turno con los datos cargados */}
      <Dialog open={!!confirmacion} onOpenChange={(abierto) => { if (!abierto) setConfirmacion(null) }}>
        <DialogContent className="max-w-md gap-0 p-0">
          {confirmacion && (
            <>
              <div className="flex flex-col items-center gap-2 rounded-t-2xl bg-green-50 px-6 py-5 text-center dark:bg-green-900/20">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <DialogTitle className="text-lg font-semibold">¡Turno confirmado!</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Donación N° {confirmacion.donacionId}{confirmacion.turnoId ? ` · Turno N° ${confirmacion.turnoId}` : ""}
                </DialogDescription>
              </div>
              <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 px-6 py-5 text-sm">
                <dt className="text-muted-foreground">Donante</dt>
                <dd className="font-medium">{confirmacion.donante}</dd>
                <dt className="text-muted-foreground">Fecha y hora</dt>
                <dd className="font-medium capitalize">
                  {new Date(confirmacion.fechaHora).toLocaleString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} hs
                </dd>
                <dt className="text-muted-foreground">Modalidad</dt>
                <dd className="font-medium">{confirmacion.modalidad}</dd>
                {confirmacion.direccion && (
                  <>
                    <dt className="text-muted-foreground">Dirección</dt>
                    <dd className="font-medium">{confirmacion.direccion}</dd>
                  </>
                )}
                {confirmacion.pesoKg && (
                  <>
                    <dt className="text-muted-foreground">Peso estimado</dt>
                    <dd className="font-medium">{confirmacion.pesoKg} kg</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Materiales</dt>
                <dd>
                  <ul className="space-y-0.5">
                    {confirmacion.materiales.map((m, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="font-medium">{m.nombre}</span>
                        <span className="tabular-nums text-muted-foreground">{m.cantidad} u.</span>
                      </li>
                    ))}
                  </ul>
                </dd>
                {confirmacion.cantFotos > 0 && (
                  <>
                    <dt className="text-muted-foreground">Fotos</dt>
                    <dd className="font-medium">{confirmacion.cantFotos} adjunta{confirmacion.cantFotos !== 1 ? "s" : ""}</dd>
                  </>
                )}
              </dl>
              <div className="flex justify-end rounded-b-2xl px-6 pb-5">
                <Button onClick={() => setConfirmacion(null)}>Entendido</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
