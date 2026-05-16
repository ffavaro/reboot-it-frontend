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
  useEstadosTurno,
  useCreateEstadoTurno,
  useUpdateEstadoTurno,
  useDeleteEstadoTurno,
} from "@/hooks/use-estado-turno"
import type { EstadoTurno } from "@/lib/type/estado-turno"

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

function EstadoBadge({ descripcion }: { descripcion: string }) {
  const key = descripcion.toLowerCase()
  const color = ESTADO_COLORS[key] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {descripcion}
    </span>
  )
}

const EMPTY_FORM = { descripcion: "" }

export default function EstadoTurnoPage() {
  const { estadosTurno, isLoading, mutate } = useEstadosTurno()
  const { createEstadoTurno, isLoading: isCreating } = useCreateEstadoTurno()
  const { updateEstadoTurno, isLoading: isUpdating } = useUpdateEstadoTurno()
  const { deleteEstadoTurno, isLoading: isDeleting } = useDeleteEstadoTurno()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<EstadoTurno | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = estadosTurno.filter((e: EstadoTurno) =>
    e.descripcion.toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(e: EstadoTurno) {
    setEditing(e)
    setForm({ descripcion: e.descripcion })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }
    try {
      if (editing) {
        await updateEstadoTurno({ id: editing.id, descripcion: form.descripcion.trim() })
        toast.success("Estado de turno actualizado")
      } else {
        await createEstadoTurno({ descripcion: form.descripcion.trim() })
        toast.success("Estado de turno creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el estado de turno")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEstadoTurno(id)
      await mutate()
      toast.success("Estado de turno desactivado")
    } catch {
      toast.error("Error al eliminar el estado de turno")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Estados de Turno</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los estados posibles de un turno (Pendiente, Confirmado, Completado, etc.).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} estado{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo estado
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando estados de turno...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron estados con ese criterio." : "No hay estados de turno registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((e: EstadoTurno) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <EstadoBadge descripcion={e.descripcion} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === e.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(e.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(e)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(e.id)}
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
            <SheetTitle>{editing ? "Editar estado de turno" : "Nuevo estado de turno"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá la descripción de "${editing.descripcion}".`
                : "Completá los datos del nuevo estado de turno."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ descripcion: e.target.value })}
                placeholder="Ej: Pendiente, Confirmado, Completado, Cancelado..."
                maxLength={100}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear estado"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}