"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
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
import { required, requiredSelect, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Empleado } from "@/lib/type/user"
import type { TableColumn } from "@/components/ui/data-table"
import { filterBySearch, openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import Title from "@/components/ui/title"

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
      <div className="flex flex-wrap items-center gap-3">
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
        {emp.cargo ?? <span className="italic"></span>}
      </span>
    ),
  },
  {
    key: "rol",
    header: "Rol",
    cell: (emp) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        {emp.rol?.nombre ?? ""}
      </span>
    ),
  },
  {
    key: "telefono",
    header: "Teléfono",
    cell: (emp) => (
      <span className="text-muted-foreground">
        {emp.telefono ?? <span className="italic"></span>}
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

  const filtered = filterBySearch(empleados, search, ["nombre", "apellido", "cargo"]) as Empleado[]

  async function handleSave() {
    if (!validate(form, {
      nombre: [required("el nombre"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      apellido: [required("el apellido"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      rolId: [requiredSelect("un rol")],
      cargo: [maxLengthValidator(DEFAULT_TEXT_MAX)],
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

  const canSave = !!form.nombre.trim() && !!form.apellido.trim() && form.rolId !== 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Gestión de Empleados"
        description="Administrá los empleados registrados en el sistema."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({ setIsViewing, setEditing, setForm, reset, setModalOpen, EMPTY_FORM })}
      />

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando empleados..."
        emptyText="No hay empleados registrados."
        emptySearchText="No se encontraron empleados."
        search={search}
        onView={(t) => openView({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: {
            rolId: t.rolId,
            nombre: t.nombre,
            apellido: t.apellido,
            telefono: t.telefono ?? "",
            cargo: t.cargo ?? "",
          },
        })}
        onEdit={(t) => openEdit({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: {
            rolId: t.rolId,
            nombre: t.nombre,
            apellido: t.apellido,
            telefono: t.telefono ?? "",
            cargo: t.cargo ?? "",
          },
        })}
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
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear empleado"}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              value={form.nombre}
              onChange={(e) => set({ setFrom: setForm, fileds: "nombre", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"), clearError })}
              placeholder="Juan"
              className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{errors.nombre}</FieldError>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Apellido *</label>
            <Input
              value={form.apellido}
              onChange={(e) => set({ setFrom: setForm, fileds: "apellido", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El apellido"), clearError })}
              placeholder="Pérez"
              className={cn(errors.apellido && "border-destructive focus-visible:ring-destructive")}
            />
            <FieldError>{errors.apellido}</FieldError>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Rol *</label>
          <select
            value={form.rolId}
            onChange={(e) => set({ setFrom: setForm, fileds: "rolId", value: Number(e.target.value), clearError })}
            className={cn(
              "w-full rounded-4xl border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
              errors.rolId ? "border-destructive" : "border-input",
            )}
          >
            <option value={0}> Seleccionar rol </option>
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
            onChange={(e) => set({ setFrom: setForm, fileds: "cargo", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El cargo"), clearError })}
            placeholder="Técnico IT"
          />
          <FieldError>{errors.cargo}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.telefono}
            onChange={(e) => set({ setFrom: setForm, fileds: "telefono", value: e.target.value.replace(/\D/g, ""), clearError })}
            placeholder="5491112345678"
            inputMode="numeric"
            maxLength={20}
          />
        </div>
      </FormModal>
    </div>
  )
}
