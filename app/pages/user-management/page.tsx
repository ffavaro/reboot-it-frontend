"use client"

import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { useUsuarios, useEmpleados, useUpdateUsuario, useDeleteUsuario } from "@/hooks/use-users"
import { Rol, Usuario } from "@/lib/type/user"

const ROLES = ["admin", "supervisor", "tecnico", "operador"] as const

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

export default function UserManagementPage() {
  const { usuarios, isLoading, mutate } = useUsuarios()
  const { empleados } = useEmpleados()
  const { updateUsuario, isLoading: isUpdating } = useUpdateUsuario()
  const { deleteUsuario, isLoading: isDeleting } = useDeleteUsuario()

  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [editRol, setEditRol] = useState("")
  const [editEmpleadoId, setEditEmpleadoId] = useState<string>("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (editingUser) {
      setEditRol(editingUser.rol.nombre)
      setEditEmpleadoId(editingUser.empleadoId ?? "")
    }
  }, [editingUser])

  const filtered = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!editingUser) return
    try {
      await updateUsuario({
        id: editingUser.id,
        rol: editRol,
        empleadoId: Number.parseInt(editEmpleadoId) || null,
      })
      await mutate()
      toast.success("Usuario actualizado correctamente")
      setEditingUser(null)
    } catch {
      toast.error("Error al actualizar el usuario")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUsuario(id)
      await mutate()
      toast.success("Usuario eliminado")
    } catch {
      toast.error("Error al eliminar el usuario")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los usuarios del sistema, sus roles y su vinculación con empleados.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empleado asociado</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando usuarios...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              filtered.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarInitials nombre={usuario.nombre} />
                      <span className="font-medium">{usuario.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{usuario.email}</td>
                  <td className="px-4 py-3">
                    <RolBadge rol={usuario.rol} />
                  </td>
                  <td className="px-4 py-3">
                    {usuario.empleado ? (
                      <span className="text-foreground">
                        {usuario.empleado.nombre} {usuario.empleado.apellido}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Sin asociar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === usuario.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleDelete(usuario.id)}
                            disabled={isDeleting}
                          >
                            Eliminar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setDeletingId(null)}
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setEditingUser(usuario)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(usuario.id)}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Editar usuario</SheetTitle>
            <SheetDescription>
              Modificá el rol y el empleado asociado de{" "}
              <span className="font-medium text-foreground">{editingUser?.nombre}</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            {/* Info readonly */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{editingUser?.email}</p>
            </div>

            {/* Rol */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Rol</label>
              <select
                value={editRol}
                onChange={(e) => setEditRol(e.target.value)}
                className={cn(
                  "w-full rounded-4xl border border-input bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                  "disabled:opacity-50"
                )}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Empleado */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Empleado asociado</label>
              <select
                value={editEmpleadoId}
                onChange={(e) => setEditEmpleadoId(e.target.value)}
                className={cn(
                  "w-full rounded-4xl border border-input bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                )}
              >
                <option value="">— Sin asociar —</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Vincula este usuario con un empleado registrado en el sistema.
              </p>
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isUpdating} className="w-full">
              {isUpdating ? "Guardando..." : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
