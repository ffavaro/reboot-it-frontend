"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useRoles, useCreateRol, useUpdateRol, useDeleteRol } from "@/hooks/use-roles"
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

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rol | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = roles.filter(
    (r: Rol) =>
      r.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (r.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(r: Rol) {
    setEditing(r)
    setForm({ nombre: r.nombre, descripcion: r.descripcion ?? "" })
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los roles del sistema y sus descripciones.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} rol{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo rol
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={editing ? "Editar rol" : "Nuevo rol"}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo rol."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear rol"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Administrador, Inspector, Transportista..."
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
            placeholder="Breve descripción del rol"
            maxLength={255}
          />
        </div>
      </FormModal>
    </div>
  )
}