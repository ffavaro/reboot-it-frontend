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
import { useRoles, useCreateRol, useUpdateRol, useDeleteRol } from "@/hooks/use-roles"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Rol } from "@/lib/type/user"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { nombre: "", descripcion: "" }

const COLUMNS: TableColumn<Rol>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (r) => <span className="font-medium">{r.nombre}</span>,
  },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (r) => (
      <span className="text-muted-foreground">
        {r.descripcion ?? <span className="italic">—</span>}
      </span>
    ),
    className: "max-w-md truncate",
  },
]

export default function RolesPage() {
  const { roles, isLoading, mutate } = useRoles()
  const { createRol, isLoading: isCreating } = useCreateRol()
  const { updateRol, isLoading: isUpdating } = useUpdateRol()
  const { deleteRol, isLoading: isDeleting } = useDeleteRol()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rol | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = roles.filter(
    (r: Rol) =>
      r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
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

  function openEdit(r: Rol) {
    setIsViewing(false)
    setEditing(r)
    setForm({ nombre: r.nombre, descripcion: r.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  function openView(r: Rol) {
    setIsViewing(true)
    setEditing(r)
    setForm({ nombre: r.nombre, descripcion: r.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      nombre: [required("el nombre"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      descripcion: [maxLengthValidator(DEFAULT_TEXT_MAX)],
    })) return
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateRol({ id: editing.id, ...payload })
        toast.success("Rol actualizado")
      } else {
        await createRol(payload)
        toast.success("Rol creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el rol")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteRol(id as string)
      await mutate()
      toast.success("Rol desactivado")
    } catch {
      toast.error("Error al eliminar el rol")
    }
  }

  const canSave = !!form.nombre.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los roles del sistema y sus descripciones.
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
          {filtered.length} rol{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo rol
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando roles..."
        emptyText="No hay roles registrados."
        emptySearchText="No se encontraron roles con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver rol" : editing ? "Editar rol" : "Nuevo rol"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo rol."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear rol"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={form.nombre}
            onChange={(e) => set("nombre", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"))}
            placeholder="Ej: Administrador, Inspector, Transportista..."
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
            onChange={(e) => set("descripcion", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción"))}
            placeholder="Breve descripción del rol"
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}
