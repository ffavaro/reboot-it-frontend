"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useRetiros,
  useCreateRetiro,
  useUpdateRetiro,
  useDeleteRetiro,
} from "@/hooks/use-retiro"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { useVehiculos } from "@/hooks/use-vehicles"
import { useDonaciones } from "@/hooks/use-donacion"
import { useTurnos } from "@/hooks/use-turno"
import type { Retiro } from "@/lib/type/retiro"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Vehiculo } from "@/lib/type/vehicle"
import type { Donacion } from "@/lib/type/donacion"
import type { Turno } from "@/lib/type/turno"
import { formatDate } from "@/lib/utils/helpers"

const EMPTY_FORM = {
  donacionId: "",
  empleadoTransportistaId: "",
  vehiculoId: "",
  fechaInicio: "",
  direccion: "",
}


const columns: TableColumn<Retiro>[] = [
  {
    key: "donacionId",
    header: "Donación",
    cell: (r) => <span className="font-mono text-xs">#{r.donacionId}</span>,
  },
  {
    key: "transportista",
    header: "Transportista",
    cell: (r) =>
      r.empleadoTransportista?.empleado
        ? `${r.empleadoTransportista.empleado.nombre} ${r.empleadoTransportista.empleado.apellido}`
        : <span className="italic text-muted-foreground">—</span>,
  },
  {
    key: "vehiculo",
    header: "Vehículo",
    cell: (r) =>
      r.vehiculo
        ? <span className="font-mono text-xs">{r.vehiculo.patente}</span>
        : <span className="italic text-muted-foreground">—</span>,
  },
  {
    key: "fechaInicio",
    header: "Fecha inicio",
    cell: (r) => (
      <span className="text-muted-foreground">
        {formatDate(r.fechaInicio) ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "direccion",
    header: "Dirección",
    className: "max-w-[200px] truncate",
    cell: (r) => (
      <span className="text-muted-foreground">
        {r.direccion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function RetiroPage() {
  const { retiros, isLoading, mutate } = useRetiros()
  const { transportistas } = useEmpleadosTransportistas()
  const { vehiculos } = useVehiculos()
  const { donaciones } = useDonaciones()
  const { turnos } = useTurnos()

  const donacionesEnProceso = donaciones.filter(
    (d: Donacion) => d.estadoDonacion?.descripcion === "En proceso"
  )
  const { createRetiro, isLoading: isCreating } = useCreateRetiro()
  const { updateRetiro, isLoading: isUpdating } = useUpdateRetiro()
  const { deleteRetiro, isLoading: isDeleting } = useDeleteRetiro()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Retiro | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = retiros.filter((r: Retiro) => {
    const q = search.toLowerCase()
    const transportista = r.empleadoTransportista?.empleado
      ? `${r.empleadoTransportista.empleado.nombre} ${r.empleadoTransportista.empleado.apellido}`.toLowerCase()
      : ""
    const patente = r.vehiculo?.patente?.toLowerCase() ?? ""
    return (
      String(r.donacionId).includes(q) ||
      transportista.includes(q) ||
      patente.includes(q) ||
      (r.direccion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(r: Retiro) {
    setIsViewing(false)
    setEditing(r)
    setForm({
      donacionId: String(r.donacionId),
      empleadoTransportistaId: String(r.empleadoTransportistaId),
      vehiculoId: r.vehiculoId ? String(r.vehiculoId) : "",
      fechaInicio: r.fechaInicio ? r.fechaInicio.slice(0, 16) : "",
      direccion: r.direccion ?? "",
    })
    setModalOpen(true)
  }

  function openView(r: Retiro) {
    setIsViewing(true)
    setEditing(r)
    setForm({
      donacionId: String(r.donacionId),
      empleadoTransportistaId: String(r.empleadoTransportistaId),
      vehiculoId: r.vehiculoId ? String(r.vehiculoId) : "",
      fechaInicio: r.fechaInicio ? r.fechaInicio.slice(0, 16) : "",
      direccion: r.direccion ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.donacionId || !form.empleadoTransportistaId) {
      toast.error("La donación y el empleado transportista son obligatorios")
      return
    }
    try {
      const payload = {
        donacionId: Number(form.donacionId),
        empleadoTransportistaId: Number(form.empleadoTransportistaId),
        vehiculoId: form.vehiculoId ? Number(form.vehiculoId) : undefined,
        fechaInicio: form.fechaInicio || undefined,
        direccion: form.direccion.trim() || undefined,
      }
      if (editing) {
        await updateRetiro({ id: editing.id, ...payload })
        toast.success("Retiro actualizado")
      } else {
        await createRetiro(payload)
        toast.success("Retiro creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el retiro")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteRetiro(Number(id))
      await mutate()
      toast.success("Retiro desactivado")
    } catch {
      toast.error("Error al eliminar el retiro")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Retiros</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los retiros de donaciones.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por donación, transportista, patente o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} retiro{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo retiro
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando retiros..."
        emptyText="No hay retiros registrados."
        emptySearchText="No se encontraron retiros con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver retiro" : editing ? "Editar retiro" : "Nuevo retiro"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del retiro." : "Registrá un nuevo retiro de donación."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear retiro"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Donación</label>
          <select
            value={form.donacionId}
            onChange={(e) => {
              const donId = e.target.value
              const don = donaciones.find((d: Donacion) => String(d.id) === donId)
              const turno = turnos.find((t: Turno) => t.donacionId === Number(donId))
              setForm((f) => ({
                ...f,
                donacionId: donId,
                empleadoTransportistaId: turno?.empleadoTransportistaId
                  ? String(turno.empleadoTransportistaId)
                  : f.empleadoTransportistaId,
                vehiculoId: turno?.empleadoTransportista?.vehiculoId
                  ? String(turno.empleadoTransportista.vehiculoId)
                  : f.vehiculoId,
                fechaInicio: turno?.fechaHora
                  ? turno.fechaHora.slice(0, 16)
                  : f.fechaInicio,
                direccion: don?.donante?.direccion ?? f.direccion,
              }))
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar donación...</option>
            {donacionesEnProceso.map((d: Donacion) => (
              <option key={d.id} value={d.id}>
                #{d.id} — {d.donante?.nombre ?? `Donante #${d.donanteId}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Empleado Transportista</label>
          <select
            value={form.empleadoTransportistaId}
            onChange={(e) => setForm((f) => ({ ...f, empleadoTransportistaId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar transportista...</option>
            {transportistas.map((t: EmpleadoTransportista) => (
              <option key={t.id} value={t.id}>
                {t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : `#${t.id}`}
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
            Fecha de inicio <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            type="datetime-local"
            value={form.fechaInicio}
            onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Dirección <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="Ej: Av. Corrientes 1234, CABA"
            value={form.direccion}
            onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}
