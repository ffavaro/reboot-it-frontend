"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useVehiculos,
  useTipoVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
  useCreateTipoVehiculo,
  useUpdateTipoVehiculo,
  useDeleteTipoVehiculo,
} from "@/hooks/use-vehicles"
import type { Vehiculo, TipoVehiculo } from "@/lib/type/vehicle"

type Tab = "vehiculos" | "tipos"

const EMPTY_VEHICULO = { tipoVehiculoId: 0, patente: "", marca: "", modelo: "" }
const EMPTY_TIPO = { descripcion: "" }

// ---------------------------------------------------------------------------
// Vehículos tab
// ---------------------------------------------------------------------------

const vehiculoColumns: TableColumn<Vehiculo>[] = [
  {
    key: "patente",
    header: "Patente",
    cell: (v) => <span className="font-mono font-medium tracking-wider">{v.patente}</span>,
  },
  {
    key: "marca",
    header: "Marca",
    cell: (v) => v.marca,
  },
  {
    key: "modelo",
    header: "Modelo",
    cell: (v) => <span className="text-muted-foreground">{v.modelo}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (v) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {v.tipoVehiculo?.descripcion ?? "—"}
      </span>
    ),
  },
]

function VehiculosTab() {
  const { vehiculos, isLoading, mutate } = useVehiculos()
  const { tipos } = useTipoVehiculos()
  const { createVehiculo, isLoading: isCreating } = useCreateVehiculo()
  const { updateVehiculo, isLoading: isUpdating } = useUpdateVehiculo()
  const { deleteVehiculo, isLoading: isDeleting } = useDeleteVehiculo()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [form, setForm] = useState(EMPTY_VEHICULO)

  const filtered = vehiculos.filter(
    (v) =>
      v.patente.toLowerCase().includes(search.toLowerCase()) ||
      v.marca.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_VEHICULO)
    setModalOpen(true)
  }

  function openEdit(v: Vehiculo) {
    setEditing(v)
    setForm({ tipoVehiculoId: v.tipoVehiculoId, patente: v.patente, marca: v.marca, modelo: v.modelo })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.patente || !form.marca || !form.modelo || !form.tipoVehiculoId) {
      toast.error("Completá todos los campos")
      return
    }
    try {
      if (editing) {
        await updateVehiculo({ id: editing.id, ...form })
        toast.success("Vehículo actualizado")
      } else {
        await createVehiculo(form)
        toast.success("Vehículo creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el vehículo")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteVehiculo(Number(id))
      await mutate()
      toast.success("Vehículo desactivado")
    } catch {
      toast.error("Error al eliminar el vehículo")
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por patente, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo vehículo
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={vehiculoColumns}
        isLoading={isLoading}
        loadingText="Cargando vehículos..."
        emptyText="No hay vehículos registrados."
        emptySearchText="No se encontraron vehículos con ese criterio."
        search={search}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar vehículo" : "Nuevo vehículo"}
        description={
          editing
            ? `Modificá los datos de ${editing.patente}.`
            : "Completá los datos del nuevo vehículo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear vehículo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Patente</label>
          <Input
            value={form.patente}
            onChange={(e) => setForm((f) => ({ ...f, patente: e.target.value.toUpperCase() }))}
            placeholder="ABC123"
            maxLength={20}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Marca</label>
          <Input
            value={form.marca}
            onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
            placeholder="Ford"
            maxLength={50}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Modelo</label>
          <Input
            value={form.modelo}
            onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
            placeholder="F-100"
            maxLength={50}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de vehículo</label>
          <select
            value={form.tipoVehiculoId}
            onChange={(e) => setForm((f) => ({ ...f, tipoVehiculoId: Number(e.target.value) }))}
            className={cn(
              "w-full rounded-4xl border border-input bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            )}
          >
            <option value={0}>— Seleccionar tipo —</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descripcion}
              </option>
            ))}
          </select>
        </div>
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tipos de Vehículo tab
// ---------------------------------------------------------------------------

const tipoVehiculoColumns: TableColumn<TipoVehiculo>[] = [
  {
    key: "descripcion",
    header: "Descripción",
    cell: (t) => <span className="font-medium">{t.descripcion}</span>,
  },
]

function TiposTab() {
  const { tipos, isLoading, mutate } = useTipoVehiculos()
  const { createTipo, isLoading: isCreating } = useCreateTipoVehiculo()
  const { updateTipo, isLoading: isUpdating } = useUpdateTipoVehiculo()
  const { deleteTipo, isLoading: isDeleting } = useDeleteTipoVehiculo()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoVehiculo | null>(null)
  const [form, setForm] = useState(EMPTY_TIPO)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_TIPO)
    setModalOpen(true)
  }

  function openEdit(t: TipoVehiculo) {
    setEditing(t)
    setForm({ descripcion: t.descripcion })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
    try {
      if (editing) {
        await updateTipo({ id: editing.id, ...form })
        toast.success("Tipo actualizado")
      } else {
        await createTipo(form)
        toast.success("Tipo creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el tipo")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteTipo(Number(id))
      await mutate()
      toast.success("Tipo desactivado")
    } catch {
      toast.error("Error al eliminar el tipo")
    }
  }

  return (
    <>
      <div className="flex items-center">
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo tipo
        </Button>
      </div>

      <DataTable
        data={tipos}
        columns={tipoVehiculoColumns}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos de vehículo registrados."
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar tipo" : "Nuevo tipo de vehículo"}
        description={
          editing
            ? `Modificá la descripción de "${editing.descripcion}".`
            : "Ingresá la descripción del nuevo tipo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Descripción</label>
          <Input
            value={form.descripcion}
            onChange={(e) => setForm({ descripcion: e.target.value })}
            placeholder="Ej: Camión, Camioneta, Auto..."
            maxLength={100}
          />
        </div>
      </FormModal>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("vehiculos")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Vehículos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los vehículos del sistema y sus tipos.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(["vehiculos", "tipos"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "vehiculos" ? "Vehículos" : "Tipos de vehículo"}
          </button>
        ))}
      </div>

      {activeTab === "vehiculos" ? <VehiculosTab /> : <TiposTab />}
    </div>
  )
}
