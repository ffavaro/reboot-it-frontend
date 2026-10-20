"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CrearButton } from "@/components/ui/crear-button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { VigenciaBadge } from "@/components/ui/vigencia-badge"
import { VehiculoInfoFields } from "@/components/vehiculo-fields"
import {
  useEmpleadosTransportistas,
  useCreateEmpleadoTransportista,
  useUpdateEmpleadoTransportista,
  useDeleteEmpleadoTransportista,
} from "@/hooks/use-empleado-transportista"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useVehiculos, useTipoVehiculos, useCreateVehiculo } from "@/hooks/use-vehicles"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, integerNonNegative } from "@/lib/form-validators"
import { uploadFoto } from "@/lib/api/client"
import { formatFechaISO, getErrorMessage, isVigente, todayISO } from "@/lib/utils/helpers"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Empleado } from "@/lib/type/user"
import type { Vehiculo, TipoVehiculo } from "@/lib/type/vehicle"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { empleadoId: "", vehiculoId: "", fechaAsignacion: "", carnetVencimiento: "" }
const EMPTY_QUICK_VEHICULO = {
  tipoVehiculoId: "", patente: "", marca: "", modelo: "",
  itvVencimiento: "", kilometraje: "", tipoCombustible: "",
}

const CARNET_MAX_BYTES = 5 * 1024 * 1024
const CARNET_TIPOS = ["image/jpeg", "image/jpg", "image/png", "image/webp"]


const COLUMNS: TableColumn<EmpleadoTransportista>[] = [
  {
    key: "empleado",
    header: "Empleado",
    cell: (t) =>
      t.empleado ? (
        <div className="flex flex-col">
          <span className="font-medium">{t.empleado.nombre} {t.empleado.apellido}</span>
          {t.empleado.cuitDni && (
            <span className="font-mono text-xs text-muted-foreground">{t.empleado.cuitDni}</span>
          )}
        </div>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "vehiculo",
    header: "Vehículo",
    cell: (t) =>
      t.vehiculo ? (
        <span className="text-muted-foreground">
          <span className="font-mono text-xs">{t.vehiculo.patente}</span>
          {" · "}
          {t.vehiculo.marca} {t.vehiculo.modelo}
        </span>
      ) : (
        <span className="italic text-muted-foreground">Sin vehículo</span>
      ),
  },
  {
    key: "carnetVencimiento",
    header: "Carnet de conducir",
    cell: (t) =>
      t.carnetVencimiento ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-muted-foreground tabular-nums">{formatFechaISO(t.carnetVencimiento)}</span>
          <VigenciaBadge fecha={t.carnetVencimiento} />
        </span>
      ) : (
        <span className="italic text-muted-foreground">Sin cargar</span>
      ),
  },
  {
    key: "fechaAsignacion",
    header: "Fecha asignación",
    cell: (t) =>
      t.fechaAsignacion ? (
        <span className="text-muted-foreground">
          {t.fechaAsignacion.slice(0, 10).split("-").reverse().join("/")}
        </span>
      ) : (
        <span className="italic text-muted-foreground">Sin fecha</span>
      ),
  },
]

export default function EmpleadoTransportistaPage() {
  const { transportistas, isLoading, mutate } = useEmpleadosTransportistas()
  const { empleados: todosEmpleados } = useEmpleadosFull()
  const empleados = todosEmpleados.filter((e: Empleado) => {
    const rol = e.rol?.nombre?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    return rol === "transportista"
  })
  // Solo se puede asignar a quien tiene carnet de conducir (el backend también lo valida)
  const sinCarnet = empleados.filter((e: Empleado) => !e.tieneCarnet).length
  const { vehiculos, mutate: mutateVehiculos } = useVehiculos()
  const { tipos } = useTipoVehiculos()
  const { createTransportista, isLoading: isCreating } = useCreateEmpleadoTransportista()
  const { updateTransportista, isLoading: isUpdating } = useUpdateEmpleadoTransportista()
  const { deleteTransportista, isLoading: isDeleting } = useDeleteEmpleadoTransportista()
  const { createVehiculo, isLoading: isCreatingVehiculo } = useCreateVehiculo()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()
  const {
    errors: vehiculoErrors,
    validate: validateVehiculo,
    clearError: clearVehiculoError,
    reset: resetVehiculoErrors,
  } = useFormErrors<typeof EMPTY_QUICK_VEHICULO>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmpleadoTransportista | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Foto del carnet de conducir
  const [carnetFile, setCarnetFile] = useState<File | null>(null)
  const [carnetPreview, setCarnetPreview] = useState<string | null>(null)
  const [carnetError, setCarnetError] = useState("")
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const [quickVehiculoOpen, setQuickVehiculoOpen] = useState(false)
  const [quickVehiculoForm, setQuickVehiculoForm] = useState(EMPTY_QUICK_VEHICULO)

  const filtered = transportistas.filter((t: EmpleadoTransportista) => {
    const q = search.toLowerCase()
    const nombreCompleto = t.empleado
      ? `${t.empleado.nombre} ${t.empleado.apellido}`.toLowerCase()
      : ""
    const patente = (t.vehiculo?.patente ?? "").toLowerCase()
    const dni = t.empleado?.cuitDni ?? ""
    return nombreCompleto.includes(q) || patente.includes(q) || dni.includes(search.trim())
  })

  // "Nombre Apellido - DNI" + estado del carnet si el empleado ya tiene su ficha de transportista
  function empleadoLabel(e: Empleado) {
    const base = `${e.nombre} ${e.apellido} - ${e.cuitDni ?? "sin DNI"}`
    const ficha = transportistas.find((t: EmpleadoTransportista) => t.empleadoId === e.id)
    if (!ficha) return `${base} · Sin carnet registrado`
    if (!ficha.carnetVencimiento) return `${base} · Sin carnet cargado`
    return isVigente(ficha.carnetVencimiento)
      ? `${base} · Carnet vigente (vence ${formatFechaISO(ficha.carnetVencimiento)})`
      : `${base} · Carnet vencido (venció ${formatFechaISO(ficha.carnetVencimiento)})`
  }

  function resetCarnetFile() {
    if (carnetPreview) URL.revokeObjectURL(carnetPreview)
    setCarnetFile(null)
    setCarnetPreview(null)
    setCarnetError("")
    setFileInputKey((k) => k + 1)
  }

  function handleCarnetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (carnetPreview) URL.revokeObjectURL(carnetPreview)
    setCarnetError("")
    if (file && !CARNET_TIPOS.includes(file.type)) {
      setCarnetError("Solo se permiten imágenes (jpg, jpeg, png, webp)")
      setCarnetFile(null)
      setCarnetPreview(null)
      setFileInputKey((k) => k + 1)
      return
    }
    if (file && file.size > CARNET_MAX_BYTES) {
      setCarnetError("La imagen no puede superar los 5 MB")
      setCarnetFile(null)
      setCarnetPreview(null)
      setFileInputKey((k) => k + 1)
      return
    }
    setCarnetFile(file)
    setCarnetPreview(file ? URL.createObjectURL(file) : null)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm({ ...EMPTY_FORM, fechaAsignacion: todayISO() })
    resetCarnetFile()
    reset()
    setModalOpen(true)
  }

  function openEdit(t: EmpleadoTransportista) {
    setIsViewing(false)
    setEditing(t)
    setForm(transportistaToForm(t))
    resetCarnetFile()
    reset()
    setModalOpen(true)
  }

  function openView(t: EmpleadoTransportista) {
    setIsViewing(true)
    setEditing(t)
    setForm(transportistaToForm(t))
    resetCarnetFile()
    reset()
    setModalOpen(true)
  }

  function transportistaToForm(t: EmpleadoTransportista) {
    return {
      empleadoId: String(t.empleadoId),
      vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
      fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
      carnetVencimiento: t.carnetVencimiento ? t.carnetVencimiento.slice(0, 10) : "",
    }
  }

  async function handleSave() {
    const formOk = validate(form, {
      empleadoId: [requiredSelect("un empleado")],
      vehiculoId: [requiredSelect("un vehículo")],
      carnetVencimiento: [required("el vencimiento del carnet")],
    })
    // Al crear (o al editar una ficha sin foto) hay que subir la foto del carnet
    const faltaFoto = !carnetFile && !editing?.carnetUrl
    if (faltaFoto) setCarnetError("Subí la foto del carnet de conducir")
    if (!formOk || faltaFoto || carnetError) return

    setIsUploading(true)
    try {
      const carnetUrl = carnetFile ? await uploadFoto(carnetFile) : editing!.carnetUrl!
      const payload = {
        empleadoId: Number(form.empleadoId),
        vehiculoId: Number(form.vehiculoId),
        fechaAsignacion: form.fechaAsignacion || undefined,
        carnetUrl,
        carnetVencimiento: form.carnetVencimiento,
      }
      if (editing) {
        await updateTransportista({ id: editing.id, ...payload })
        toast.success("Empleado transportista actualizado")
      } else {
        await createTransportista(payload)
        toast.success("Empleado transportista creado")
      }
      await mutate()
      setModalOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al guardar el empleado transportista"))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteTransportista(id as number)
      await mutate()
      toast.success("Empleado transportista desactivado")
    } catch {
      toast.error("Error al eliminar el empleado transportista")
    }
  }

  function openQuickVehiculo() {
    setQuickVehiculoForm(EMPTY_QUICK_VEHICULO)
    resetVehiculoErrors()
    setQuickVehiculoOpen(true)
  }

  function setQuickVehiculoField(field: keyof typeof EMPTY_QUICK_VEHICULO, value: string) {
    setQuickVehiculoForm((f) => ({ ...f, [field]: value }))
    clearVehiculoError(field)
  }

  async function handleSaveQuickVehiculo() {
    if (!validateVehiculo(quickVehiculoForm, {
      patente: [required("la patente")],
      marca: [required("la marca")],
      modelo: [required("el modelo")],
      tipoVehiculoId: [requiredSelect("un tipo de vehículo")],
      tipoCombustible: [requiredSelect("el tipo de combustible")],
      kilometraje: [required("el kilometraje"), integerNonNegative()],
      itvVencimiento: [required("el vencimiento de la ITV")],
    })) return
    try {
      const nuevo = await createVehiculo({
        tipoVehiculoId: Number(quickVehiculoForm.tipoVehiculoId),
        patente: quickVehiculoForm.patente.trim(),
        marca: quickVehiculoForm.marca.trim(),
        modelo: quickVehiculoForm.modelo.trim(),
        itvVencimiento: quickVehiculoForm.itvVencimiento,
        kilometraje: Number(quickVehiculoForm.kilometraje),
        tipoCombustible: quickVehiculoForm.tipoCombustible,
      })
      await mutateVehiculos()
      if (nuevo) {
        setForm((f) => ({ ...f, vehiculoId: String(nuevo.id) }))
        clearError("vehiculoId")
      }
      toast.success("Vehículo creado")
      setQuickVehiculoOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Error al crear el vehículo"))
    }
  }

  const canSave = !!form.empleadoId && !!form.vehiculoId && !!form.carnetVencimiento
  const canSaveQuickVehiculo =
    !!quickVehiculoForm.patente.trim() && !!quickVehiculoForm.marca.trim() &&
    !!quickVehiculoForm.modelo.trim() && !!quickVehiculoForm.tipoVehiculoId &&
    !!quickVehiculoForm.tipoCombustible && !!quickVehiculoForm.kilometraje && !!quickVehiculoForm.itvVencimiento

  const fotoActual = editing?.carnetUrl

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Empleados Transportistas</h1>
        <p className="text-sm text-muted-foreground">
          Administrá la asignación de empleados a vehículos de transporte.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre, DNI o patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} transportista{filtered.length !== 1 ? "s" : ""}
        </span>
        <CrearButton className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo transportista
        </CrearButton>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando transportistas..."
        emptyText="No hay empleados transportistas registrados."
        emptySearchText="No se encontraron transportistas con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver transportista" : "Gestionar transportista"}
        readOnly={isViewing}
        description={
          editing
            ? "Modificá la asignación del empleado transportista."
            : "Asigná un empleado como transportista."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating || isUploading}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear transportista"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Empleado *</label>
          <select
            value={form.empleadoId}
            onChange={(e) => { setForm((f) => ({ ...f, empleadoId: e.target.value })); clearError("empleadoId") }}
            className={cn(
              "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              errors.empleadoId ? "border-destructive" : "border-input",
            )}
          >
            <option value="">Seleccionar empleado...</option>
            {empleados.filter((e: Empleado) => !!e.tieneCarnet || String(e.id) === form.empleadoId).map((e: Empleado) => (
              <option key={e.id} value={e.id}>
                {empleadoLabel(e)}
              </option>
            ))}
          </select>
          <FieldError>{errors.empleadoId}</FieldError>
          {sinCarnet > 0 && (
            <p className="text-xs text-muted-foreground">
              {sinCarnet} empleado{sinCarnet !== 1 ? "s" : ""} con rol Transportista no figura{sinCarnet !== 1 ? "n" : ""} con carnet: marcá «Tiene carnet de conducir» en Empleados para poder asignarlo.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Vehículo *</label>
          <div className="flex gap-2">
            <select
              value={form.vehiculoId}
              onChange={(e) => { setForm((f) => ({ ...f, vehiculoId: e.target.value })); clearError("vehiculoId") }}
              className={cn(
                "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                errors.vehiculoId ? "border-destructive" : "border-input",
              )}
            >
              <option value="">Seleccionar vehículo...</option>
              {vehiculos.map((v: Vehiculo) => (
                <option key={v.id} value={v.id}>
                  {v.patente} — {v.marca} {v.modelo}
                </option>
              ))}
            </select>
            {!isViewing && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="No está en la lista: crear nuevo vehículo"
                onClick={openQuickVehiculo}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FieldError>{errors.vehiculoId}</FieldError>
        </div>

        {/* Carnet de conducir */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            Vencimiento del carnet *
            <VigenciaBadge fecha={form.carnetVencimiento} />
          </label>
          <DatePicker
            variant="field"
            value={form.carnetVencimiento}
            onChange={(v) => { setForm((f) => ({ ...f, carnetVencimiento: v })); clearError("carnetVencimiento") }}
            placeholder="Seleccionar fecha"
            aria-label="Vencimiento del carnet de conducir"
          />
          <FieldError>{errors.carnetVencimiento}</FieldError>
        </div>

        {fotoActual && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Foto del carnet actual</p>
            <a href={fotoActual} target="_blank" rel="noopener noreferrer" className={cn(isViewing && "pointer-events-auto")}>
              <img
                src={fotoActual}
                alt="Carnet de conducir"
                className="h-32 w-auto rounded-md object-contain border border-border hover:opacity-80 transition-opacity"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            </a>
          </div>
        )}

        {!isViewing && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              {fotoActual ? "Reemplazar foto del carnet" : "Foto del carnet de conducir *"}
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                {fotoActual ? "(opcional)" : "(jpg, jpeg, png, webp — máx. 5 MB)"}
              </span>
            </label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleCarnetChange}
              className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm file:font-medium file:cursor-pointer cursor-pointer"
            />
            {carnetPreview && (
              <img
                src={carnetPreview}
                alt="Vista previa del carnet"
                className="h-32 w-auto rounded-md object-contain border border-border"
              />
            )}
            <FieldError>{carnetError}</FieldError>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha de asignación</label>
          <Input
            type="date"
            value={form.fechaAsignacion}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, fechaAsignacion: e.target.value }))}
          />
        </div>
      </FormModal>

      {/* Alta rápida de vehículo */}
      <FormModal
        open={quickVehiculoOpen}
        onOpenChange={setQuickVehiculoOpen}
        title="Gestionar vehículo"
        description="Cargá los datos del vehículo para asignarlo al transportista."
        onSave={handleSaveQuickVehiculo}
        isLoading={isCreatingVehiculo}
        saveDisabled={!canSaveQuickVehiculo}
        saveLabel="Crear vehículo"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Patente *</label>
          <Input
            value={quickVehiculoForm.patente}
            onChange={(e) => setQuickVehiculoField("patente", e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={20}
            className={cn(vehiculoErrors.patente && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{vehiculoErrors.patente}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Marca *</label>
          <Input
            value={quickVehiculoForm.marca}
            onChange={(e) => setQuickVehiculoField("marca", e.target.value)}
            placeholder="Ford"
            maxLength={50}
            className={cn(vehiculoErrors.marca && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{vehiculoErrors.marca}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Modelo *</label>
          <Input
            value={quickVehiculoForm.modelo}
            onChange={(e) => setQuickVehiculoField("modelo", e.target.value)}
            placeholder="F-100"
            maxLength={50}
            className={cn(vehiculoErrors.modelo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{vehiculoErrors.modelo}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de vehículo *</label>
          <select
            value={quickVehiculoForm.tipoVehiculoId}
            onChange={(e) => setQuickVehiculoField("tipoVehiculoId", e.target.value)}
            className={cn(
              "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              vehiculoErrors.tipoVehiculoId ? "border-destructive" : "border-input",
            )}
          >
            <option value="">Seleccionar tipo...</option>
            {tipos.map((t: TipoVehiculo) => (
              <option key={t.id} value={t.id}>{t.descripcion}</option>
            ))}
          </select>
          <FieldError>{vehiculoErrors.tipoVehiculoId}</FieldError>
        </div>

        <VehiculoInfoFields
          values={quickVehiculoForm}
          errors={vehiculoErrors}
          onChange={setQuickVehiculoField}
        />
      </FormModal>
    </div>
  )
}
