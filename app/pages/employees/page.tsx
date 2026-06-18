"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useEmpleadosFull,
  useRoles,
  useCreateEmpleado,
  useUpdateEmpleado,
  useDeleteEmpleado,
} from "@/hooks/use-employees"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect } from "@/lib/form-validators"
import type { Empleado } from "@/lib/type/user"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = {
  rolId: 0,
  nombre: "",
  apellido: "",
  telefono: "",
  cargo: "",
}

function AvatarInitials({ nombre, apellido }: { nombre: string; apellido: string }) {
  const initials = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      {initials}
    </div>
  )
}

const COLUMNS: TableColumn<Empleado>[] = [
  {
    key: "nombre",
    header: "Empleado",
    cell: (emp) => (
      <div className="flex items-center gap-3">
        <AvatarInitials nombre={emp.nombre} apellido={emp.apellido} />
        <span className="font-medium">{emp.nombre} {emp.apellido}</span>
      </div>
    ),
  },
  {
    key: "cargo",
    header: "Cargo",
    cell: (emp) => (
      <span className="text-muted-foreground">
        {emp.cargo ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "rol",
    header: "Rol",
    cell: (emp) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {emp.rol?.nombre ?? "—"}
      </span>
    ),
  },
  {
    key: "telefono",
    header: "Teléfono",
    cell: (emp) => (
      <span className="text-muted-foreground">
        {emp.telefono ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function EmployeePage() {
  const { empleados, isLoading, mutate } = useEmpleadosFull()
  const { roles } = useRoles()
  const { createEmpleado, isLoading: isCreating } = useCreateEmpleado()
  const { updateEmpleado, isLoading: isUpdating } = useUpdateEmpleado()
  const { deleteEmpleado, isLoading: isDeleting } = useDeleteEmpleado()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Empleado | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.apellido.toLowerCase().includes(search.toLowerCase()) ||
      (e.cargo ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function set(field: keyof typeof EMPTY_FORM, value: string | number) {
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

  function openEdit(e: Empleado) {
    setIsViewing(false)
    setEditing(e)
    setForm({
      rolId: e.rolId,
      nombre: e.nombre,
      apellido: e.apellido,
      telefono: e.telefono ?? "",
      cargo: e.cargo ?? "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(e: Empleado) {
    setIsViewing(true)
    setEditing(e)
    setForm({
      rolId: e.rolId,
      nombre: e.nombre,
      apellido: e.apellido,
      telefono: e.telefono ?? "",
      cargo: e.cargo ?? "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      nombre: [required("el nombre")],
      apellido: [required("el apellido")],
      rolId: [requiredSelect("un rol")],
    })) return
    try {
      const payload = {
        rolId: form.rolId,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim() || undefined,
        cargo: form.cargo.trim() || undefined,
      }
      if (editing) {
        await updateEmpleado({ id: editing.id, ...payload })
        toast.success("Empleado actualizado")
      } else {
        await createEmpleado(payload)
        toast.success("Empleado creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el empleado")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteEmpleado(id as number)
      await mutate()
      toast.success("Empleado desactivado")
    } catch {
      toast.error("Error al eliminar el empleado")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Empleados</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los empleados registrados en el sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre, apellido o cargo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} empleado{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo empleado
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando empleados..."
        emptyText="No hay empleados registrados."
        emptySearchText="No se encontraron empleados."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver empleado" : editing ? "Editar empleado" : "Nuevo empleado"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de ${editing.nombre} ${editing.apellido}.`
            : "Completá los datos del nuevo empleado."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear empleado"}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Juan"
              maxLength={100}
              className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{errors.nombre}</FieldError>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Apellido</label>
            <Input
              value={form.apellido}
              onChange={(e) => set("apellido", e.target.value)}
              placeholder="Pérez"
              maxLength={100}
              className={cn(errors.apellido && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{errors.apellido}</FieldError>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Rol</label>
          <select
            value={form.rolId}
            onChange={(e) => set("rolId", Number(e.target.value))}
            className={cn(
              "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
              errors.rolId ? "border-destructive" : "border-input",
            )}
          >
            <option value={0}>— Seleccionar rol —</option>
            {roles.filter((r) => r.nombre.toLowerCase() !== "donante").map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          <FieldError>{errors.rolId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Cargo <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.cargo}
            onChange={(e) => set("cargo", e.target.value)}
            placeholder="Técnico IT"
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value.replace(/\D/g, ""))}
            placeholder="5491112345678"
            inputMode="numeric"
            maxLength={20}
          />
        </div>
      </FormModal>
    </div>
  )
}
