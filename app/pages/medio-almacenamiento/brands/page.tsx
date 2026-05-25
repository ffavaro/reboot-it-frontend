"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useMarcas, useCreateMarca, useUpdateMarca, useDeleteMarca } from "@/hooks/use-marca"
import type { Marca } from "@/lib/type/marca"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { nombre: "" }

const COLUMNS: TableColumn<Marca>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (m) => <span className="font-medium">{m.nombre}</span>,
  },
]

export default function MarcasPage() {
  const { marcas, isLoading, mutate } = useMarcas()
  const { createMarca, isLoading: isCreating } = useCreateMarca()
  const { updateMarca, isLoading: isUpdating } = useUpdateMarca()
  const { deleteMarca, isLoading: isDeleting } = useDeleteMarca()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Marca | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = marcas.filter((m: Marca) =>
    m.nombre.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(m: Marca) {
    setIsViewing(false)
    setEditing(m)
    setForm({ nombre: m.nombre })
    setModalOpen(true)
  }

  function openView(m: Marca) {
    setIsViewing(true)
    setEditing(m)
    setForm({ nombre: m.nombre })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      if (editing) {
        await updateMarca({ id: editing.id, nombre: form.nombre.trim() })
        toast.success("Marca actualizada")
      } else {
        await createMarca({ nombre: form.nombre.trim() })
        toast.success("Marca creada")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar la marca")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteMarca(id as number)
      await mutate()
      toast.success("Marca desactivada")
    } catch {
      toast.error("Error al eliminar la marca")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Marcas</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las marcas de medios de almacenamiento (Seagate, WD, Kingston, etc.).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} marca{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva marca
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando marcas..."
        emptyText="No hay marcas registradas."
        emptySearchText="No se encontraron marcas con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver marca" : editing ? "Editar marca" : "Nueva marca"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos de la nueva marca."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear marca"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ nombre: e.target.value })}
            placeholder="Ej: Seagate, WD, Kingston, Samsung..."
            maxLength={50}
          />
        </div>
      </FormModal>
    </div>
  )
}
