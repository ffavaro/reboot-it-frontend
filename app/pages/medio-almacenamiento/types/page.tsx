"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useTipos, useCreateTipo, useUpdateTipo, useDeleteTipo } from "@/hooks/use-tipo"
import type { Tipo } from "@/lib/type/tipo"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { nombre: "" }

const COLUMNS: TableColumn<Tipo>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (t) => <span className="font-medium">{t.nombre}</span>,
  },
]

export default function TiposPage() {
  const { tipos, isLoading, mutate } = useTipos()
  const { createTipo, isLoading: isCreating } = useCreateTipo()
  const { updateTipo, isLoading: isUpdating } = useUpdateTipo()
  const { deleteTipo, isLoading: isDeleting } = useDeleteTipo()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tipo | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = tipos.filter((t: Tipo) =>
    t.nombre.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(t: Tipo) {
    setIsViewing(false)
    setEditing(t)
    setForm({ nombre: t.nombre })
    setModalOpen(true)
  }

  function openView(t: Tipo) {
    setIsViewing(true)
    setEditing(t)
    setForm({ nombre: t.nombre })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      if (editing) {
        await updateTipo({ id: editing.id, nombre: form.nombre.trim() })
        toast.success("Tipo actualizado")
      } else {
        await createTipo({ nombre: form.nombre.trim() })
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
      await deleteTipo(id as number)
      await mutate()
      toast.success("Tipo desactivado")
    } catch {
      toast.error("Error al eliminar el tipo")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Tipos de Medio de Almacenamiento</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los tipos de medio de almacenamiento (HDD, SSD, USB, etc.).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} tipo{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos registrados."
        emptySearchText="No se encontraron tipos con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver tipo" : editing ? "Editar tipo" : "Nuevo tipo"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo tipo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ nombre: e.target.value })}
            placeholder="Ej: HDD, SSD, Pendrive, DVD..."
            maxLength={50}
          />
        </div>
      </FormModal>
    </div>
  )
}
