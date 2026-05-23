"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useUsuarios, useEmpleados, useUpdateUsuario, useDeleteUsuario, useCreateUsuario } from "@/hooks/use-users"
import { useRoles } from "@/hooks/use-roles"
import type { Rol, Usuario } from "@/lib/type/user"

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

const SELECT_CLASS =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 disabled:opacity-50"

const EMPTY_FORM = {
  nombre: "",
  email: "",
  password: "",
  rolId: "",
  empleadoId: "",
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
  const { updateUsuario, isLoading: isUpdating } = useUpdateUsuario()
  const { createUsuario, isLoading: isCreating } = useCreateUsuario()
  const { deleteUsuario, isLoading: isDeleting } = useDeleteUsuario()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const isEdit = !!editingUser
  const isSaving = isUpdating || isCreating

  useEffect(() => {
    if (editingUser) {
      setForm({
        nombre: editingUser.nombre,
        email: editingUser.email,
        password: "",
        rolId: editingUser.rol.id,
        empleadoId: editingUser.empleadoId ?? "",
      })
    }
  }, [editingUser])

  function openCreate() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(user: Usuario) {
    setEditingUser(user)
    setModalOpen(true)
  }

  function handleModalChange(open: boolean) {
    if (!open) {
      setModalOpen(false)
      setEditingUser(null)
    }
  }

  const filtered = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave() {
    try {
      if (isEdit && editingUser) {
        await updateUsuario({
          id: editingUser.id,
          rolId: Number(form.rolId),
          empleadoId: form.empleadoId ? Number(form.empleadoId) : null,
        })
        toast.success("Usuario actualizado correctamente")
      } else {
        await createUsuario({
          nombre: form.nombre,
          email: form.email,
          password: form.password || undefined,
          rolId: Number(form.rolId),
          empleadoId: form.empleadoId ? Number(form.empleadoId) : null,
        })
        toast.success("Usuario creado correctamente")
      }
      await mutate()
      setModalOpen(false)
      setEditingUser(null)
    } catch {
      toast.error(isEdit ? "Error al actualizar el usuario" : "Error al crear el usuario")
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={handleModalChange}
        title={isEdit ? "Editar usuario" : "Nuevo usuario"}
        description={
          isEdit
            ? `Modificá el rol y el empleado asociado de ${editingUser?.nombre}.`
            : "Completá los datos para crear un nuevo usuario."
        }
        onSave={handleSave}
        isLoading={isSaving}
        saveLabel={isEdit ? "Guardar cambios" : "Crear usuario"}
      >
        {!isEdit && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Juan García"
                onInvalid={(e) => e.currentTarget.setCustomValidity("Por favor, ingresá un nombre")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@ejemplo.com"
                onInvalid={(e) => e.currentTarget.setCustomValidity("Por favor, ingresá un email válido")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Contraseña{" "}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Por defecto: reboot2024_it"
                onInvalid={(e) => e.currentTarget.setCustomValidity("La contraseña debe tener al menos 6 caracteres")}
              />
            </div>
          </>
        )}

        {isEdit && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{editingUser?.email}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Rol</label>
          <select
            value={form.rolId}
            onChange={(e) => setForm({ ...form, rolId: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">— Seleccionar rol —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Empleado asociado</label>
          <select
            value={form.empleadoId}
            onChange={(e) => setForm({ ...form, empleadoId: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">— Sin asociar —</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellido}
              </option>
            ))}
          </select>
        </div>
      </FormModal>
    </div>
  )
}
