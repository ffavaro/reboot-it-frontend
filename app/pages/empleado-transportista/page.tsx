"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useVehiculos, useTipoVehiculos } from "@/hooks/use-vehicles"
import { useFormErrors } from "@/hooks/use-form-errors"
import {  requiredSelect } from "@/lib/form-validators"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Empleado } from "@/lib/type/user"
import type { Vehiculo } from "@/lib/type/vehicle"
import type { TableColumn } from "@/components/ui/data-table"
import Title from "@/components/ui/title"
import { filterBySearch, openCreate, openEdit, openView } from "@/lib/utils/utils-modal"


const EMPTY_FORM = { empleadoId: "", vehiculoId: "", fechaAsignacion: ""}

const COLUMNS: TableColumn<EmpleadoTransportista>[] = [
  {
    key: "empleado",
    header: "Empleado",
    cell: (t) =>
      t.empleado ? (
        <span className="font-medium">{t.empleado.nombre} {t.empleado.apellido}</span>
      ) : (
        <span className="italic text-muted-foreground"></span>
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
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmpleadoTransportista | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = filterBySearch(transportistas, search, ["nombre", "apellido", "pantente", "nombreCompleto"])

  const handleSave = async () => {
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

  const handleDelete = async (id: number | string) => {
    try {
      await deleteTransportista(id as number)
      await mutate()
      toast.success("Empleado transportista desactivado")
    } catch {
      toast.error("Error al eliminar el empleado transportista")
    }
  }

  const canSave = !!form.empleadoId && !!form.vehiculoId

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Empleados Transportista"
        description="Administrá la asignación de empleados a vehículos de transporte."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          EMPTY_FORM
        })}
      />

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando transportistas..."
        emptyText="No hay empleados transportistas registrados."
        emptySearchText="No se encontraron transportistas con ese criterio."
        search={search}
        onView={(t) => openView({
          t: t,
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          jsonEntidad: {
            empleadoId: String(t.empleadoId),
            vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
            fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
          }
        })}
        onEdit={(t) => openEdit({
          t: t,
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          jsonEntidad: {
            empleadoId: String(t.empleadoId),
            vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
            fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
          }
        })}
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
                {e.nombre} {e.apellido}{e.cargo ? `  ${e.cargo}` : ""}
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
                  {v.patente}  {v.marca} {v.modelo}
                </option>
              ))}
            </select>
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
    </div>
  )
}