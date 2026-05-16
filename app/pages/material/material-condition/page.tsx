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
  useCondicionesMaterial,
  useCreateCondicionMaterial,
  useUpdateCondicionMaterial,
  useDeleteCondicionMaterial,
} from "@/hooks/use-condicion-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"

const EMPTY_FORM = { condicion: "", descripcion: "" }

const BADGE_COLORS: Record<string, string> = {
  funcional:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  reparable:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  obsoleto:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  irreparable: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function CondicionBadge({ condicion }: { condicion: string }) {
  const cls = BADGE_COLORS[condicion.toLowerCase()] ?? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {condicion}
    </span>
  )
}

export default function CondicionMaterialPage() {
  const { condiciones, isLoading, mutate } = useCondicionesMaterial()
  const { createCondicion, isLoading: isCreating } = useCreateCondicionMaterial()
  const { updateCondicion, isLoading: isUpdating } = useUpdateCondicionMaterial()
  const { deleteCondicion, isLoading: isDeleting } = useDeleteCondicionMaterial()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<CondicionMaterial | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = condiciones.filter(
    (c) =>
      c.condicion.toLowerCase().includes(search.toLowerCase()) ||
      (c.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(c: CondicionMaterial) {
    setEditing(c)
    setForm({ condicion: c.condicion, descripcion: c.descripcion ?? "" })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.condicion.trim()) {
      toast.error("La condición es obligatoria")
      return
    }
    try {
      const payload = {
        condicion: form.condicion.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateCondicion({ id: editing.id, ...payload })
        toast.success("Condición actualizada")
      } else {
        await createCondicion(payload)
        toast.success("Condición creada")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar la condición")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCondicion(id)
      await mutate()
      toast.success("Condición desactivada")
    } catch {
      toast.error("Error al eliminar la condición")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Condiciones de Material</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las condiciones posibles que puede tener un material al ingresar al sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por condición o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} condición{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva condición
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condición</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando condiciones...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron condiciones con ese criterio." : "No hay condiciones registradas."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <CondicionBadge condicion={c.condicion} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                    {c.descripcion ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === c.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleDelete(c.id)}
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
            <SheetTitle>{editing ? "Editar condición" : "Nueva condición de material"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos de "${editing.condicion}".`
                : "Completá los datos de la nueva condición."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Condición</label>
              <Input
                value={form.condicion}
                onChange={(e) => setForm((f) => ({ ...f, condicion: e.target.value }))}
                placeholder="Ej: Funcional, Reparable, Obsoleto..."
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Breve descripción de la condición"
                maxLength={255}
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating}
              className="w-full"
            >
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear condición"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
