"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useEmpleadosTransportistas,
  useCreateEmpleadoTransportista,
  useUpdateEmpleadoTransportista,
  useDeleteEmpleadoTransportista,
} from "@/hooks/use-empleado-transportista"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useVehiculos, useTipoVehiculos, useCreateVehiculo } from "@/hooks/use-vehicles"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect } from "@/lib/form-validators"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Empleado } from "@/lib/type/user"
import type { Vehiculo, TipoVehiculo } from "@/lib/type/vehicle"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { empleadoId: "", vehiculoId: "", fechaAsignacion: "" }
const EMPTY_QUICK_VEHICULO = { tipoVehiculoId: "", patente: "", marca: "", modelo: "" }

function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

const COLUMNS: TableColumn<EmpleadoTransportista>[] = [
  {
    key: "empleado",
    header: "Empleado",
    cell: (t) =>
      t.empleado ? (
        <span className="font-medium">{t.empleado.nombre} {t.empleado.apellido}</span>
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

  const [quickVehiculoOpen, setQuickVehiculoOpen] = useState(false)
  const [quickVehiculoForm, setQuickVehiculoForm] = useState(EMPTY_QUICK_VEHICULO)

  const filtered = transportistas.filter((t: EmpleadoTransportista) => {
    const q = search.toLowerCase()
    const nombreCompleto = t.empleado
      ? `${t.empleado.nombre} ${t.empleado.apellido}`.toLowerCase()
      : ""
    const patente = (t.vehiculo?.patente ?? "").toLowerCase()
    return nombreCompleto.includes(q) || patente.includes(q)
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm({ ...EMPTY_FORM, fechaAsignacion: todayISO() })
    reset()
    setModalOpen(true)
  }

  function openEdit(t: EmpleadoTransportista) {
    setIsViewing(false)
    setEditing(t)
    setForm({
      empleadoId: String(t.empleadoId),
      vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
      fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(t: EmpleadoTransportista) {
    setIsViewing(true)
    setEditing(t)
    setForm({
      empleadoId: String(t.empleadoId),
      vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
      fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      empleadoId: [requiredSelect("un empleado")],
      vehiculoId: [requiredSelect("un vehículo")],
    })) return
    try {
      const payload = {
        empleadoId: Number(form.empleadoId),
        vehiculoId: Number(form.vehiculoId),
        fechaAsignacion: form.fechaAsignacion || undefined,
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
    } catch {
      toast.error("Error al guardar el empleado transportista")
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

  async function handleSaveQuickVehiculo() {
    if (!validateVehiculo(quickVehiculoForm, {
      patente: [required("la patente")],
      marca: [required("la marca")],
      modelo: [required("el modelo")],
      tipoVehiculoId: [requiredSelect("un tipo de vehículo")],
    })) return
    try {
      const nuevo = await createVehiculo({
        tipoVehiculoId: Number(quickVehiculoForm.tipoVehiculoId),
        patente: quickVehiculoForm.patente.trim(),
        marca: quickVehiculoForm.marca.trim(),
        modelo: quickVehiculoForm.modelo.trim(),
      })
      await mutateVehiculos()
      if (nuevo) {
        setForm((f) => ({ ...f, vehiculoId: String(nuevo.id) }))
        clearError("vehiculoId")
      }
      toast.success("Vehículo creado")
      setQuickVehiculoOpen(false)
    } catch {
      toast.error("Error al crear el vehículo")
    }
  }

  const canSave = !!form.empleadoId && !!form.vehiculoId
  const canSaveQuickVehiculo =
    !!quickVehiculoForm.patente.trim() && !!quickVehiculoForm.marca.trim() &&
    !!quickVehiculoForm.modelo.trim() && !!quickVehiculoForm.tipoVehiculoId

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
          placeholder="Buscar por nombre o patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} transportista{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo transportista
        </Button>
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
        title={isViewing ? "Ver transportista" : editing ? "Editar transportista" : "Nuevo transportista"}
        readOnly={isViewing}
        description={
          editing
            ? "Modificá la asignación del empleado transportista."
            : "Asigná un empleado como transportista."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
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
            {empleados.map((e: Empleado) => (
              <option key={e.id} value={e.id}>
                {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
              </option>
            ))}
          </select>
          <FieldError>{errors.empleadoId}</FieldError>
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
        title="Nuevo vehículo"
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
            onChange={(e) => {
              setQuickVehiculoForm((f) => ({ ...f, patente: e.target.value.toUpperCase() }))
              clearVehiculoError("patente")
            }}
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
            onChange={(e) => {
              setQuickVehiculoForm((f) => ({ ...f, marca: e.target.value }))
              clearVehiculoError("marca")
            }}
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
            onChange={(e) => {
              setQuickVehiculoForm((f) => ({ ...f, modelo: e.target.value }))
              clearVehiculoError("modelo")
            }}
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
            onChange={(e) => {
              setQuickVehiculoForm((f) => ({ ...f, tipoVehiculoId: e.target.value }))
              clearVehiculoError("tipoVehiculoId")
            }}
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
      </FormModal>
    </div>
  )
}