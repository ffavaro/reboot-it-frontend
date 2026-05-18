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
  useClasificaciones,
  useCreateClasificacion,
  useUpdateClasificacion,
  useDeleteClasificacion,
} from "@/hooks/use-clasificacion"
import { useLotes } from "@/hooks/use-lote"
import { useEmpleadosFull } from "@/hooks/use-employees"
import type { Clasificacion } from "@/lib/type/clasificacion"
import type { Lote } from "@/lib/type/lote"
import type { Empleado } from "@/lib/type/user"

const EMPTY_FORM = { loteId: "", fecha: "", empleadoId: "" }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function ClasificacionPage() {
  const { clasificaciones, isLoading, mutate } = useClasificaciones()
  const { lotes } = useLotes()
  const { empleados } = useEmpleadosFull()
  const { createClasificacion, isLoading: isCreating } = useCreateClasificacion()
  const { updateClasificacion, isLoading: isUpdating } = useUpdateClasificacion()
  const { deleteClasificacion, isLoading: isDeleting } = useDeleteClasificacion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Clasificacion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = clasificaciones.filter((c: Clasificacion) => {
    const q = search.toLowerCase()
    const empleado = c.empleado
      ? `${c.empleado.nombre} ${c.empleado.apellido}`.toLowerCase()
      : ""
    return String(c.loteId).includes(q) || empleado.includes(q)
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(c: Clasificacion) {
    setEditing(c)
    setForm({
      loteId: String(c.loteId),
      fecha: c.fecha ? c.fecha.slice(0, 10) : "",
      empleadoId: c.empleadoId ? String(c.empleadoId) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.loteId) {
      toast.error("El lote es obligatorio")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        fecha: form.fecha || undefined,
        empleadoId: form.empleadoId ? Number(form.empleadoId) : undefined,
      }
      if (editing) {
        await updateClasificacion({ id: editing.id, ...payload })
        toast.success("Clasificación actualizada")
      } else {
        await createClasificacion(payload)
        toast.success("Clasificación creada")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar la clasificación")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteClasificacion(id)
      await mutate()
      toast.success("Clasificación desactivada")
    } catch {
      toast.error("Error al eliminar la clasificación")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Clasificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las clasificaciones de lotes realizadas por empleadoes.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote o empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} clasificación{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva clasificación
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lote</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inspector</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando clasificaciones...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron clasificaciones con ese criterio."
                    : "No hay clasificaciones registradas."}
                </td>
              </tr>
            ) : (
              filtered.map((c: Clasificacion) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    #{c.loteId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.fecha) ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.empleado
                      ? `${c.empleado.nombre} ${c.empleado.apellido}`
                      : <span className="italic text-muted-foreground">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === c.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(c.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(c)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(c.id)}
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
            <SheetTitle>{editing ? "Editar clasificación" : "Nueva clasificación"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos de la clasificación del lote #${editing.loteId}.`
                : "Registrá una nueva clasificación de lote."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Lote</label>
              <select
                value={form.loteId}
                onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar lote...</option>
                {lotes.map((l: Lote) => (
                  <option key={l.id} value={l.id}>
                    Lote #{l.id}{l.pesoBrutoKg ? ` — ${l.pesoBrutoKg} kg` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Fecha <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Inspector <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.empleadoId}
                onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin empleado asignado</option>
                {empleados.map((e: Empleado) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear clasificación"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
