"use client"

import { useState } from "react"
import { toast } from "react-toastify"
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
  useEmpleadosTransportistas,
  useCreateEmpleadoTransportista,
  useUpdateEmpleadoTransportista,
  useDeleteEmpleadoTransportista,
} from "@/hooks/use-empleado-transportista"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useVehiculos } from "@/hooks/use-vehicles"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Empleado } from "@/lib/type/user"
import type { Vehiculo } from "@/lib/type/vehicle"

const EMPTY_FORM = { empleadoId: "", vehiculoId: "", fechaAsignacion: "" }

export default function EmpleadoTransportistaPage() {
  const { transportistas, isLoading, mutate } = useEmpleadosTransportistas()
  const { empleados } = useEmpleadosFull()
  const { vehiculos } = useVehiculos()
  const { createTransportista, isLoading: isCreating } = useCreateEmpleadoTransportista()
  const { updateTransportista, isLoading: isUpdating } = useUpdateEmpleadoTransportista()
  const { deleteTransportista, isLoading: isDeleting } = useDeleteEmpleadoTransportista()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<EmpleadoTransportista | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = transportistas.filter((t: EmpleadoTransportista) => {
    const q = search.toLowerCase()
    const nombreCompleto = t.empleado
      ? `${t.empleado.nombre} ${t.empleado.apellido}`.toLowerCase()
      : ""
    const patente = (t.vehiculo?.patente ?? "").toLowerCase()
    return nombreCompleto.includes(q) || patente.includes(q)
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(t: EmpleadoTransportista) {
    setEditing(t)
    setForm({
      empleadoId: String(t.empleadoId),
      vehiculoId: t.vehiculoId ? String(t.vehiculoId) : "",
      fechaAsignacion: t.fechaAsignacion ? t.fechaAsignacion.slice(0, 16) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.empleadoId) {
      toast.error("El empleado es obligatorio")
      return
    }
    try {
      const payload = {
        empleadoId: Number(form.empleadoId),
        vehiculoId: form.vehiculoId ? Number(form.vehiculoId) : undefined,
        fechaAsignacion: form.fechaAsignacion || undefined,
      }
      if (editing) {
        await updateTransportista({ id: editing.id, ...payload })
        toast.success("Empleado transportista actualizado")
      } else {
        await createTransportista(payload)
        toast.success("Empleado transportista creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el empleado transportista")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTransportista(id)
      await mutate()
      toast.success("Empleado transportista desactivado")
    } catch {
      toast.error("Error al eliminar el empleado transportista")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Empleados Transportistas</h1>
        <p className="text-sm text-muted-foreground">
          Administrá la asignación de empleados a vehículos de transporte.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre o patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} transportista{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo transportista
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empleado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehículo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha asignación</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando transportistas...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron transportistas con ese criterio."
                    : "No hay empleados transportistas registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((t: EmpleadoTransportista) => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {t.empleado
                      ? `${t.empleado.nombre} ${t.empleado.apellido}`
                      : <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.vehiculo
                      ? (
                        <span>
                          <span className="font-mono text-xs">{t.vehiculo.patente}</span>
                          {" · "}
                          {t.vehiculo.marca} {t.vehiculo.modelo}
                        </span>
                      )
                      : <span className="italic">Sin vehículo</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.fechaAsignacion
                      ? new Date(t.fechaAsignacion).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : <span className="italic">Sin fecha</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === t.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(t.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(t)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(t.id)}
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

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && setSheetOpen(false)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar transportista" : "Nuevo transportista"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Modificá la asignación del empleado transportista."
                : "Asigná un empleado como transportista."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Empleado</label>
              <select
                value={form.empleadoId}
                onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar empleado...</option>
                {empleados.map((e: Empleado) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Vehículo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.vehiculoId}
                onChange={(e) => setForm((f) => ({ ...f, vehiculoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin vehículo asignado</option>
                {vehiculos.map((v: Vehiculo) => (
                  <option key={v.id} value={v.id}>
                    {v.patente} — {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Fecha de asignación <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="datetime-local"
                value={form.fechaAsignacion}
                onChange={(e) => setForm((f) => ({ ...f, fechaAsignacion: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear transportista"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}