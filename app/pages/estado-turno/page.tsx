"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useEstadosTurno,
  useCreateEstadoTurno,
  useUpdateEstadoTurno,
  useDeleteEstadoTurno,
} from "@/hooks/use-estado-turno"
import type { EstadoTurno } from "@/lib/type/estado-turno"
import type { TableColumn } from "@/components/ui/data-table"

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

function EstadoBadge({ descripcion }: { descripcion: string }) {
  const key = descripcion.toLowerCase()
  const color = ESTADO_COLORS[key] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {descripcion}
    </span>
  )
}

const EMPTY_FORM = { descripcion: "" }

const COLUMNS: TableColumn<EstadoTurno>[] = [
  {
    key: "descripcion",
    header: "Descripción",
    cell: (e) => <EstadoBadge descripcion={e.descripcion} />,
  },
]

export default function EstadoTurnoPage() {
  const { estadosTurno, isLoading, mutate } = useEstadosTurno()
  const { createEstadoTurno, isLoading: isCreating } = useCreateEstadoTurno()
  const { updateEstadoTurno, isLoading: isUpdating } = useUpdateEstadoTurno()
  const { deleteEstadoTurno, isLoading: isDeleting } = useDeleteEstadoTurno()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EstadoTurno | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = estadosTurno.filter((e: EstadoTurno) =>
    e.descripcion.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(e: EstadoTurno) {
    setIsViewing(false)
    setEditing(e)
    setForm({ descripcion: e.descripcion })
    setModalOpen(true)
  }

  function openView(e: EstadoTurno) {
    setIsViewing(true)
    setEditing(e)
    setForm({ descripcion: e.descripcion })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
    try {
      if (editing) {
        await updateEstadoTurno({ id: editing.id, descripcion: form.descripcion.trim() })
        toast.success("Estado de turno actualizado")
      } else {
        await createEstadoTurno({ descripcion: form.descripcion.trim() })
        toast.success("Estado de turno creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el estado de turno")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteEstadoTurno(id as number)
      await mutate()
      toast.success("Estado de turno desactivado")
    } catch {
      toast.error("Error al eliminar el estado de turno")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Estados de Turno</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los estados posibles de un turno (Pendiente, Confirmado, Completado, etc.).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por descripción..."
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
        loadingText="Cargando estados de turno..."
        emptyText="No hay estados de turno registrados."
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
        title={isViewing ? "Ver estado de turno" : editing ? "Editar estado de turno" : "Nuevo estado de turno"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá la descripción de "${editing.descripcion}".`
            : "Completá los datos del nuevo estado de turno."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear estado"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Descripción</label>
          <Input
            value={form.descripcion}
            onChange={(e) => setForm({ descripcion: e.target.value })}
            placeholder="Ej: Pendiente, Confirmado, Completado, Cancelado..."
            maxLength={100}
          />
        </div>
      </FormModal>
    </div>
  )
}