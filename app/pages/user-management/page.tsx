"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useUsuarios, useEmpleados, useUpdateUsuario, useDeleteUsuario, useCreateUsuario } from "@/hooks/use-users"
import { useRoles } from "@/hooks/use-roles"
import { useDonantes, useUpdateDonante } from "@/hooks/use-donantes"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, requiredSelect, minLength } from "@/lib/form-validators"
import type { Rol, Usuario } from "@/lib/type/user"
import type { Donante } from "@/lib/type/donante"

const ROL_STYLES: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  supervisor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  tecnico: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  operador: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

function RolBadge({ rol }: { rol: Rol }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        ROL_STYLES[rol.nombre] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      )}
    >
      {rol.nombre}
    </span>
  )
}

function AvatarInitials({ nombre }: { nombre: string }) {
  const initials = nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
      {initials}
    </div>
  )
}

const SELECT_CLASS = (hasError?: boolean) =>
  cn(
    "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50",
    hasError ? "border-destructive focus:ring-destructive" : "border-input"
  )

const EMPTY_FORM = {
  nombre: "",
  email: "",
  password: "",
  rolId: "",
  empleadoId: "",
  donanteId: "",
}

const COLUMNS: TableColumn<Usuario>[] = [
  {
    key: "nombre",
    header: "Usuario",
    cell: (row) => (
      <div className="flex items-center gap-3">
        <AvatarInitials nombre={row.nombre} />
        <span className="font-medium">{row.nombre}</span>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
  },
  {
    key: "rol",
    header: "Rol",
    cell: (row) => <RolBadge rol={row.rol} />,
  },
  {
    key: "empleado",
    header: "Empleado asociado",
    cell: (row) =>
      row.empleado ? (
        <span>{row.empleado.nombre} {row.empleado.apellido}</span>
      ) : (
        <span className="text-muted-foreground italic">Sin asociar</span>
      ),
  },
]

export default function UserManagementPage() {
  const { usuarios, isLoading, mutate } = useUsuarios()
  const { empleados } = useEmpleados()
  const { roles } = useRoles()
  const { donantes } = useDonantes()
  const { updateUsuario, isLoading: isUpdating } = useUpdateUsuario()
  const { createUsuario, isLoading: isCreating } = useCreateUsuario()
  const { deleteUsuario, isLoading: isDeleting } = useDeleteUsuario()
  const { updateDonante } = useUpdateDonante()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const isEdit = !!editingUser
  const isSaving = isUpdating || isCreating

  const selectedRol = roles.find((r) => String(r.id) === String(form.rolId))
  const esDonante = selectedRol?.nombre.toLowerCase() === "donante"

  useEffect(() => {
    if (editingUser) {
      const donanteVinculado = donantes.find(
        (d: Donante) => d.usuarioId != null && String(d.usuarioId) === String(editingUser.id)
      )
      setForm({
        nombre: editingUser.nombre,
        email: editingUser.email,
        password: "",
        rolId: String(editingUser.rol.id),
        empleadoId: editingUser.empleadoId ? String(editingUser.empleadoId) : "",
        donanteId: donanteVinculado ? String(donanteVinculado.id) : "",
      })
    }
  }, [editingUser, donantes])

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    clearError(key)
  }

  function handleRolChange(rolId: string) {
    setForm((f) => ({ ...f, rolId, empleadoId: "", donanteId: "" }))
    clearError("rolId")
    clearError("empleadoId")
    clearError("donanteId")
  }

  function openCreate() {
    setIsViewing(false)
    setEditingUser(null)
    setForm(EMPTY_FORM)
    reset()
    setModalOpen(true)
  }

  function openEdit(user: Usuario) {
    setIsViewing(false)
    reset()
    setEditingUser(user)
    setModalOpen(true)
  }

  function openView(user: Usuario) {
    setIsViewing(true)
    reset()
    setEditingUser(user)
    setModalOpen(true)
  }

  function handleModalChange(open: boolean) {
    if (!open) {
      setModalOpen(false)
      setEditingUser(null)
      reset()
    }
  }

  const filtered = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave() {
    const ok = validate(form, {
      ...(!isEdit ? {
        nombre: [required("el nombre")],
        email: [required("el email")],
        password: [required("la contraseña"), minLength(6)],
      } : {}),
      rolId: [requiredSelect("un rol")],
      ...(form.rolId && esDonante ? { donanteId: [requiredSelect("un donante")] } : {}),
      ...(form.rolId && !esDonante ? { empleadoId: [requiredSelect("un empleado")] } : {}),
    })
    if (!ok) return

    try {
      if (isEdit && editingUser) {
        await updateUsuario({
          id: editingUser.id,
          rolId: Number(form.rolId),
          empleadoId: esDonante ? null : (form.empleadoId ? Number(form.empleadoId) : null),
        })
        if (esDonante && form.donanteId) {
          await updateDonante({ id: Number(form.donanteId), usuarioId: Number(editingUser.id) })
        }
        toast.success("Usuario actualizado correctamente")
      } else {
        const newUser = await createUsuario({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          rolId: Number(form.rolId),
          empleadoId: esDonante ? null : (form.empleadoId ? Number(form.empleadoId) : null),
        })
        if (esDonante && form.donanteId && newUser) {
          await updateDonante({ id: Number(form.donanteId), usuarioId: Number(newUser.id) })
        }
        toast.success("Usuario creado correctamente")
      }
      await mutate()
      setModalOpen(false)
      setEditingUser(null)
    } catch (error: any) {
      if (error.statusCode === 409) {
        toast.error("El email ya está registrado en otro usuario")
      } else {
        toast.error(isEdit ? "Error al actualizar el usuario" : "Error al crear el usuario")
      }
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteUsuario(String(id))
      await mutate()
      toast.success("Usuario eliminado")
    } catch {
      toast.error("Error al eliminar el usuario")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los usuarios del sistema, sus roles y su vinculación con empleados.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate} className="ml-auto">
          Nuevo usuario
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando usuarios..."
        emptyText="No hay usuarios registrados."
        emptySearchText="No se encontraron usuarios con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={handleModalChange}
        title={isViewing ? "Ver usuario" : isEdit ? "Editar usuario" : "Nuevo usuario"}
        readOnly={isViewing}
        description={
          isEdit
            ? `Modificá el rol y el empleado asociado de ${editingUser?.nombre}.`
            : "Completá los datos para crear un nuevo usuario."
        }
        onSave={handleSave}
        isLoading={isSaving}
        saveLabel={isEdit ? "Guardar cambios" : "Crear usuario"}
      >
        {/* Campos solo en creación */}
        {!isEdit && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Juan García"
                className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.nombre}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="juan@ejemplo.com"
                className={cn(errors.email && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.email}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Contraseña{" "}
                <span className="text-muted-foreground font-normal">(mín. 6 caracteres)</span>
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="••••••••"
                className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
              />
              <FieldError>{errors.password}</FieldError>
            </div>
          </>
        )}

        {/* Email de solo lectura en edición */}
        {isEdit && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{editingUser?.email}</p>
          </div>
        )}

        {/* Rol */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Rol</label>
          <select
            value={form.rolId}
            onChange={(e) => handleRolChange(e.target.value)}
            disabled={isViewing}
            className={SELECT_CLASS(!!errors.rolId)}
          >
            <option value="">— Seleccionar rol —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
              </option>
            ))}
          </select>
          <FieldError>{errors.rolId}</FieldError>
        </div>

        {/* Select de donante — solo cuando el rol es donante */}
        {form.rolId && esDonante && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Donante</label>
            <select
              value={form.donanteId}
              onChange={(e) => setField("donanteId", e.target.value)}
              disabled={isViewing}
              className={SELECT_CLASS(!!errors.donanteId)}
            >
              <option value="">— Seleccionar donante —</option>
              {donantes.map((d: Donante) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}{d.razonSocial ? ` — ${d.razonSocial}` : ""}
                </option>
              ))}
            </select>
            <FieldError>{errors.donanteId}</FieldError>
          </div>
        )}

        {/* Select de empleado — cualquier otro rol */}
        {form.rolId && !esDonante && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Empleado asociado</label>
            <select
              value={form.empleadoId}
              onChange={(e) => setField("empleadoId", e.target.value)}
              disabled={isViewing}
              className={SELECT_CLASS(!!errors.empleadoId)}
            >
              <option value="">— Seleccionar empleado —</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido}
                </option>
              ))}
            </select>
            <FieldError>{errors.empleadoId}</FieldError>
          </div>
        )}
      </FormModal>
    </div>
  )
}
