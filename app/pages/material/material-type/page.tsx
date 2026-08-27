"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useTipoMateriales,
  useCreateTipoMaterial,
  useUpdateTipoMaterial,
  useDeleteTipoMaterial,
} from "@/hooks/use-tipo-material"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required } from "@/lib/form-validators"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { nombre: "", descripcion: "" }

const COLUMNS: TableColumn<TipoMaterial>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (t) => <span className="font-medium">{t.nombre}</span>,
  },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (t) => (
      <span className="text-muted-foreground">
        {t.descripcion ?? <span className="italic">—</span>}
      </span>
    ),
    className: "max-w-md truncate",
  },
]

export default function TipoMaterialPage() {
  const { tipoMateriales, isLoading, mutate } = useTipoMateriales()
  const { createTipoMaterial, isLoading: isCreating } = useCreateTipoMaterial()
  const { updateTipoMaterial, isLoading: isUpdating } = useUpdateTipoMaterial()
  const { deleteTipoMaterial, isLoading: isDeleting } = useDeleteTipoMaterial()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoMaterial | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = tipoMateriales.filter(
    (t) =>
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (t.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    reset()
    setModalOpen(true)
  }

  function openEdit(t: TipoMaterial) {
    setIsViewing(false)
    setEditing(t)
    setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  function openView(t: TipoMaterial) {
    setIsViewing(true)
    setEditing(t)
    setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, { nombre: [required("el nombre")] })) return
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || "",
      }
      if (editing) {
        await updateTipoMaterial({ id: editing.id, ...payload })
        toast.success("Tipo de material actualizado")
      } else {
        await createTipoMaterial(payload)
        toast.success("Tipo de material creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el tipo de material")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteTipoMaterial(id as number)
      await mutate()
      toast.success("Tipo de material desactivado")
    } catch {
      toast.error("Error al eliminar el tipo de material")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Tipos de Material</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las categorías de materiales que ingresan al sistema.
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
        loadingText="Cargando tipos de material..."
        emptyText="No hay tipos de material registrados."
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
        title={isViewing ? "Ver tipo de material" : editing ? "Editar tipo de material" : "Nuevo tipo de material"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo tipo de material."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej: Electrónico, Eléctrico, Batería..."
            maxLength={100}
            className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.nombre}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Breve descripción del tipo de material"
            maxLength={255}
          />
        </div>
      </FormModal>
    </div>
  )
}
