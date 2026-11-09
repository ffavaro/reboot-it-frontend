"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useMarcas, useCreateMarca, useUpdateMarca, useDeleteMarca } from "@/hooks/use-marca"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Marca } from "@/lib/type/marca"
import type { TableColumn } from "@/components/ui/data-table"
import { filterBySearch, openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import { useFormErrors } from "@/hooks/use-form-errors"
import Title from "@/components/ui/title"

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
  const { clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const filtered = filterBySearch(marcas, search, ["nombre"]) as Marca[]

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

  const canSave = !!form.nombre.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Marcas"
        description="Administrá las marcas de medios de almacenamiento (Seagate, WD, Kingston, etc.)."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({ setIsViewing, setEditing, setForm, reset, setModalOpen, EMPTY_FORM })}
      />

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando marcas..."
        emptyText="No hay marcas registradas."
        emptySearchText="No se encontraron marcas con ese criterio."
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
        title={isViewing ? "Ver marca" : editing ? "Editar marca" : "Nueva marca"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos de la nueva marca."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear marca"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={form.nombre}
            onChange={(e) => set({ setFrom: setForm, fileds: "nombre", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"), clearError })}
            placeholder="Ej: Seagate, WD, Kingston, Samsung..."
          />
        </div>
      </FormModal>
    </div>
  )
}
