"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useEmpleadosTransportistas,
  useCreateEmpleadoTransportista,
  useUpdateEmpleadoTransportista,
  useDeleteEmpleadoTransportista,
} from "@/hooks/use-empleado-transportista"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useVehiculos } from "@/hooks/use-vehicles"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Empleado } from "@/lib/type/user"
import type { Vehiculo } from "@/lib/type/vehicle"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { empleadoId: "", vehiculoId: "", fechaAsignacion: "" }

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
  const { empleados } = useEmpleadosFull()
  const { vehiculos } = useVehiculos()
  const { createTransportista, isLoading: isCreating } = useCreateEmpleadoTransportista()
  const { updateTransportista, isLoading: isUpdating } = useUpdateEmpleadoTransportista()
  const { deleteTransportista, isLoading: isDeleting } = useDeleteEmpleadoTransportista()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmpleadoTransportista | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = transportistas.filter((t: EmpleadoTransportista) => {
    const q = search.toLowerCase()
    const nombreCompleto = t.empleado
      ? `${t.empleado.nombre} ${t.empleado.apellido}`.toLowerCase()
      : ""
    const patente = (t.vehiculo?.patente ?? "").toLowerCase()
    return nombreCompleto.includes(q) || patente.includes(q)
  })

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, fechaAsignacion: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  function openEdit(t: EmpleadoTransportista) {
    setEditing(t)
    setForm({
      empleadoId: String(t.empleadoId),
      vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
      fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 10) : "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.empleadoId) {
      toast.error("El empleado es obligatorio")
      return
    }
    try {
      const payload = {
        empleadoId: Number(form.empleadoId),
        vehiculoId: form.vehiculoId ? Number(form.vehiculoId) : undefined,
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Empleados Transportistas</h1>
        <p className="text-sm text-muted-foreground">
          Administrá la asignación de empleados a vehículos de transporte.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre o patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} transportista{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo transportista
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={editing ? "Editar transportista" : "Nuevo transportista"}
        description={
          editing
            ? "Modificá la asignación del empleado transportista."
            : "Asigná un empleado como transportista."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear transportista"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Empleado</label>
          <select
            value={form.empleadoId}
            onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar empleado...</option>
            {empleados.map((e: Empleado) => (
              <option key={e.id} value={e.id}>
                {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Vehículo <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.vehiculoId}
            onChange={(e) => setForm((f) => ({ ...f, vehiculoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin vehículo asignado</option>
            {vehiculos.map((v: Vehiculo) => (
              <option key={v.id} value={v.id}>
                {v.patente} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Fecha de asignación <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            type="date"
            value={form.fechaAsignacion}
            onChange={(e) => setForm((f) => ({ ...f, fechaAsignacion: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}