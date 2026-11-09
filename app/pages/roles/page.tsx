"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useRoles, useCreateRol, useUpdateRol, useDeleteRol } from "@/hooks/use-roles"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Rol } from "@/lib/type/user"
import type { TableColumn } from "@/components/ui/data-table"
import { filterBySearch, openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import Title from "@/components/ui/title"

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
        {r.descripcion ?? <span className="italic"></span>}
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

  const filtered = filterBySearch(roles, search, ["nombre", "descripcion"]);

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
      <Title
        titlePage="Roles"
        description="Administrá los roles del sistema y sus descripciones."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          EMPTY_FORM
        })}></Title>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando roles..."
        emptyText="No hay roles registrados."
        emptySearchText="No se encontraron roles con ese criterio."
        search={search}
        onView={(t) => openView({
          t: t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: { nombre: t.nombre, descripcion: t.descripcion ?? "" }
        })}
        onEdit={(t) => openEdit({
          t: t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: { nombre: t.nombre, descripcion: t.descripcion ?? "" }
        })}
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
            onChange={(e) => set({ setFrom: setForm, fileds: "nombre", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"), clearError })}
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
            onChange={(e) => set({ setFrom: setForm, fileds: "descripcion", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción"), clearError })}
            placeholder="Breve descripción del rol"
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}
