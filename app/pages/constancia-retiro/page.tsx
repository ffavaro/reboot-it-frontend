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
  useConstanciasRetiro,
  useCreateConstanciaRetiro,
  useUpdateConstanciaRetiro,
  useDeleteConstanciaRetiro,
} from "@/hooks/use-constancia-retiro"
import { useEmpleadosFull } from "@/hooks/use-employees"
import type { ConstanciaRetiro } from "@/lib/type/constancia-retiro"
import type { Empleado } from "@/lib/type/user"

const EMPTY_FORM = { retiroId: "", fechaEmision: "", observaciones: "", tecnicoId: "" }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function ConstanciaRetiroPage() {
  const { constancias, isLoading, mutate } = useConstanciasRetiro()
  const { empleados } = useEmpleadosFull()
  const { createConstancia, isLoading: isCreating } = useCreateConstanciaRetiro()
  const { updateConstancia, isLoading: isUpdating } = useUpdateConstanciaRetiro()
  const { deleteConstancia, isLoading: isDeleting } = useDeleteConstanciaRetiro()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ConstanciaRetiro | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = constancias.filter((c: ConstanciaRetiro) => {
    const q = search.toLowerCase()
    const tecnico = c.tecnico ? `${c.tecnico.nombre} ${c.tecnico.apellido}`.toLowerCase() : ""
    return (
      String(c.retiroId).includes(q) ||
      (c.observaciones ?? "").toLowerCase().includes(q) ||
      tecnico.includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(c: ConstanciaRetiro) {
    setEditing(c)
    setForm({
      retiroId: String(c.retiroId),
      fechaEmision: c.fechaEmision ? c.fechaEmision.slice(0, 10) : "",
      observaciones: c.observaciones ?? "",
      tecnicoId: c.tecnicoId ? String(c.tecnicoId) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.retiroId) {
      toast.error("El retiro es obligatorio")
      return
    }
    try {
      const payload = {
        retiroId: Number(form.retiroId),
        fechaEmision: form.fechaEmision || undefined,
        observaciones: form.observaciones.trim() || undefined,
        tecnicoId: form.tecnicoId ? Number(form.tecnicoId) : undefined,
      }
      if (editing) {
        await updateConstancia({ id: editing.id, ...payload })
        toast.success("Constancia de retiro actualizada")
      } else {
        await createConstancia(payload)
        toast.success("Constancia de retiro creada")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar la constancia de retiro")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteConstancia(id)
      await mutate()
      toast.success("Constancia de retiro desactivada")
    } catch {
      toast.error("Error al eliminar la constancia de retiro")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Constancias de Retiro</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las constancias emitidas para cada retiro de materiales.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por retiro, técnico u observaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} constancia{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva constancia
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Retiro</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha emisión</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Técnico</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Observaciones</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando constancias...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron constancias con ese criterio."
                    : "No hay constancias de retiro registradas."}
                </td>
              </tr>
            ) : (
              filtered.map((c: ConstanciaRetiro) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    #{c.retiroId}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.fechaEmision) ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.tecnico
                      ? `${c.tecnico.nombre} ${c.tecnico.apellido}`
                      : <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {c.observaciones ?? <span className="italic">—</span>}
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
            <SheetTitle>{editing ? "Editar constancia" : "Nueva constancia de retiro"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos de la constancia del retiro #${editing.retiroId}.`
                : "Registrá una nueva constancia de retiro."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">ID de Retiro</label>
              <Input
                type="number"
                value={form.retiroId}
                onChange={(e) => setForm((f) => ({ ...f, retiroId: e.target.value }))}
                placeholder="Ej: 1"
                min={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Fecha de emisión <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="date"
                value={form.fechaEmision}
                onChange={(e) => setForm((f) => ({ ...f, fechaEmision: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Técnico responsable <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.tecnicoId}
                onChange={(e) => setForm((f) => ({ ...f, tecnicoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin técnico asignado</option>
                {empleados.map((e: Empleado) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Observaciones <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                placeholder="Ej: Material recibido conforme. Sin observaciones."
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear constancia"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
