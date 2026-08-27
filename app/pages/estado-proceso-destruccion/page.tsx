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
  useEstadosProcesoDestruccion,
  useCreateEstadoProcesoDestruccion,
  useUpdateEstadoProcesoDestruccion,
  useDeleteEstadoProcesoDestruccion,
} from "@/hooks/use-estado-proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"

const ESTADO_COLORS: Record<string, string> = {
  Iniciado: "bg-blue-100 text-blue-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
  Finalizado: "bg-green-100 text-green-800",
}

const EMPTY_FORM = { nombre: "", descripcion: "" }

const COLUMNS: TableColumn<EstadoProcesoDestruccion>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (e) => {
      const color = ESTADO_COLORS[e.nombre] ?? "bg-gray-100 text-gray-800"
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
          {e.nombre}
        </span>
      )
    },
  },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (e) =>
      e.descripcion
        ? <span className="text-sm text-muted-foreground">{e.descripcion}</span>
        : <span className="italic text-muted-foreground">—</span>,
  },
]

export default function EstadoProcesoDestruccionPage() {
  const { estados, isLoading, mutate } = useEstadosProcesoDestruccion()
  const { createEstado, isLoading: isCreating } = useCreateEstadoProcesoDestruccion()
  const { updateEstado, isLoading: isUpdating } = useUpdateEstadoProcesoDestruccion()
  const { deleteEstado, isLoading: isDeleting } = useDeleteEstadoProcesoDestruccion()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EstadoProcesoDestruccion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = estados.filter((e: EstadoProcesoDestruccion) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(e: EstadoProcesoDestruccion) {
    setIsViewing(false)
    setEditing(e)
    setForm({ nombre: e.nombre, descripcion: e.descripcion ?? "" })
    setModalOpen(true)
  }

  function openView(e: EstadoProcesoDestruccion) {
    setIsViewing(true)
    setEditing(e)
    setForm({ nombre: e.nombre, descripcion: e.descripcion ?? "" })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateEstado({ id: editing.id, ...payload })
        toast.success("Estado actualizado")
      } else {
        await createEstado(payload)
        toast.success("Estado creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el estado")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteEstado(id as number)
      await mutate()
      toast.success("Estado desactivado")
    } catch {
      toast.error("Error al eliminar el estado")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Estados de Proceso de Destrucción</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los estados posibles de un proceso de destrucción (Iniciado, Pendiente, Finalizado, etc.).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} estado{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo estado
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando estados..."
        emptyText="No hay estados registrados."
        emptySearchText="No se encontraron estados con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={
          isViewing
            ? "Ver estado"
            : editing
              ? "Editar estado"
              : "Nuevo estado de proceso de destrucción"
        }
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo estado."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear estado"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Iniciado, Pendiente, Finalizado..."
            maxLength={50}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripción del estado..."
            maxLength={255}
          />
        </div>
      </FormModal>
    </div>
  )
}
