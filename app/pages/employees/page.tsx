"use client"

import { useState } from "react"
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
import {
  useEmpleadosFull,
  useRoles,
  useCreateEmpleado,
  useUpdateEmpleado,
  useDeleteEmpleado,
} from "@/hooks/use-employees"
import type { Empleado } from "@/lib/type/user"

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

export default function EmployeePage() {
  const { empleados, isLoading, mutate } = useEmpleadosFull()
  const { roles } = useRoles()
  const { createEmpleado, isLoading: isCreating } = useCreateEmpleado()
  const { updateEmpleado, isLoading: isUpdating } = useUpdateEmpleado()
  const { deleteEmpleado, isLoading: isDeleting } = useDeleteEmpleado()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Empleado | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.apellido.toLowerCase().includes(search.toLowerCase()) ||
      (e.cargo ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(e: Empleado) {
    setEditing(e)
    setForm({
      rolId: e.rolId,
      nombre: e.nombre,
      apellido: e.apellido,
      telefono: e.telefono ?? "",
      cargo: e.cargo ?? "",
    })
    setSheetOpen(true)
  }

  function set(field: keyof typeof EMPTY_FORM, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.rolId) {
      toast.error("Nombre, apellido y rol son obligatorios")
      return
    }
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
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el empleado")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEmpleado(id)
      await mutate()
      toast.success("Empleado desactivado")
    } catch {
      toast.error("Error al eliminar el empleado")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Empleados</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los empleados registrados en el sistema.
        </p>
      </div>

      {/* Toolbar */}
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

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empleado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cargo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teléfono</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando empleados...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No se encontraron empleados.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarInitials nombre={emp.nombre} apellido={emp.apellido} />
                      <span className="font-medium">
                        {emp.nombre} {emp.apellido}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {emp.cargo ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {emp.rol?.nombre ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {emp.telefono ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === emp.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleDelete(emp.id)}
                            disabled={isDeleting}
                          >
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(emp)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(emp.id)}
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

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => !open && setSheetOpen(false)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar empleado" : "Nuevo empleado"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos de ${editing.nombre} ${editing.apellido}.`
                : "Completá los datos del nuevo empleado."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Juan"
                  maxLength={100}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Apellido</label>
                <Input
                  value={form.apellido}
                  onChange={(e) => set("apellido", e.target.value)}
                  placeholder="Pérez"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Rol</label>
              <select
                value={form.rolId}
                onChange={(e) => set("rolId", Number(e.target.value))}
                className={cn(
                  "w-full rounded-4xl border border-input bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                )}
              >
                <option value={0}>— Seleccionar rol —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
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
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+54 9 11 1234-5678"
                maxLength={20}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear empleado"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
