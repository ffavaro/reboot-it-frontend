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
  useRetiros,
  useCreateRetiro,
  useUpdateRetiro,
  useDeleteRetiro,
} from "@/hooks/use-retiro"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { useVehiculos } from "@/hooks/use-vehicles"
import type { Retiro } from "@/lib/type/retiro"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Vehiculo } from "@/lib/type/vehicle"

const EMPTY_FORM = {
  donacionId: "",
  empleadoTransportistaId: "",
  vehiculoId: "",
  fechaInicio: "",
  direccion: "",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function RetiroPage() {
  const { retiros, isLoading, mutate } = useRetiros()
  const { transportistas } = useEmpleadosTransportistas()
  const { vehiculos } = useVehiculos()
  const { createRetiro, isLoading: isCreating } = useCreateRetiro()
  const { updateRetiro, isLoading: isUpdating } = useUpdateRetiro()
  const { deleteRetiro, isLoading: isDeleting } = useDeleteRetiro()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Retiro | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = retiros.filter((r: Retiro) => {
    const q = search.toLowerCase()
    const transportista = r.empleadoTransportista?.empleado
      ? `${r.empleadoTransportista.empleado.nombre} ${r.empleadoTransportista.empleado.apellido}`.toLowerCase()
      : ""
    const patente = r.vehiculo?.patente?.toLowerCase() ?? ""
    return (
      String(r.donacionId).includes(q) ||
      transportista.includes(q) ||
      patente.includes(q) ||
      (r.direccion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(r: Retiro) {
    setEditing(r)
    setForm({
      donacionId: String(r.donacionId),
      empleadoTransportistaId: String(r.empleadoTransportistaId),
      vehiculoId: r.vehiculoId ? String(r.vehiculoId) : "",
      fechaInicio: r.fechaInicio ? r.fechaInicio.slice(0, 16) : "",
      direccion: r.direccion ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.donacionId || !form.empleadoTransportistaId) {
      toast.error("La donación y el empleado transportista son obligatorios")
      return
    }
    try {
      const payload = {
        donacionId: Number(form.donacionId),
        empleadoTransportistaId: Number(form.empleadoTransportistaId),
        vehiculoId: form.vehiculoId ? Number(form.vehiculoId) : undefined,
        fechaInicio: form.fechaInicio || undefined,
        direccion: form.direccion.trim() || undefined,
      }
      if (editing) {
        await updateRetiro({ id: editing.id, ...payload })
        toast.success("Retiro actualizado")
      } else {
        await createRetiro(payload)
        toast.success("Retiro creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el retiro")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRetiro(id)
      await mutate()
      toast.success("Retiro desactivado")
    } catch {
      toast.error("Error al eliminar el retiro")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Retiros</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los retiros de donaciones.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por donación, transportista, patente o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} retiro{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo retiro
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Donación</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transportista</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehículo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha inicio</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dirección</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando retiros...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron retiros con ese criterio." : "No hay retiros registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((r: Retiro) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">#{r.donacionId}</td>
                  <td className="px-4 py-3">
                    {r.empleadoTransportista?.empleado
                      ? `${r.empleadoTransportista.empleado.nombre} ${r.empleadoTransportista.empleado.apellido}`
                      : <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.vehiculo
                      ? <span className="font-mono text-xs">{r.vehiculo.patente}</span>
                      : <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.fechaInicio) ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                    {r.direccion ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === r.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(r.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(r)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(r.id)}
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
            <SheetTitle>{editing ? "Editar retiro" : "Nuevo retiro"}</SheetTitle>
            <SheetDescription>
              {editing ? "Modificá los datos del retiro." : "Registrá un nuevo retiro de donación."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">ID de Donación</label>
              <Input
                type="number"
                placeholder="Ej: 1"
                value={form.donacionId}
                onChange={(e) => setForm((f) => ({ ...f, donacionId: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Empleado Transportista</label>
              <select
                value={form.empleadoTransportistaId}
                onChange={(e) => setForm((f) => ({ ...f, empleadoTransportistaId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar transportista...</option>
                {transportistas.map((t: EmpleadoTransportista) => (
                  <option key={t.id} value={t.id}>
                    {t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : `#${t.id}`}
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
                Fecha de inicio <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="datetime-local"
                value={form.fechaInicio}
                onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Dirección <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="Ej: Av. Corrientes 1234, CABA"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear retiro"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
