"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useTipos, useCreateTipo, useUpdateTipo, useDeleteTipo } from "@/hooks/use-tipo"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Tipo } from "@/lib/type/tipo"
import type { TableColumn } from "@/components/ui/data-table"
import { filterBySearch, openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import { useFormErrors } from "@/hooks/use-form-errors"
import Title from "@/components/ui/title"

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
  const { clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const filtered = filterBySearch(tipos, search, ["nombre"]) as Tipo[]

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

  const canSave = !!form.nombre.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Tipos de Medio de Almacenamiento"
        description="Administrá los tipos de medio de almacenamiento (HDD, SSD, USB, etc.)."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({ setIsViewing, setEditing, setForm, reset, setModalOpen, EMPTY_FORM })}
      />

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando tipos..."
        emptyText="No hay tipos registrados."
        emptySearchText="No se encontraron tipos con ese criterio."
        search={search}
        onView={(t) => openView({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: { nombre: t.nombre },
        })}
        onEdit={(t) => openEdit({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: { nombre: t.nombre },
        })}
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
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={form.nombre}
            onChange={(e) => set({ setFrom: setForm, fileds: "nombre", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"), clearError })}
            placeholder="Ej: HDD, SSD, Pendrive, DVD..."
          />
        </div>
      </FormModal>
    </div>
  )
}
