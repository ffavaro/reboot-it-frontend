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
import { useRacks, useCreateRack, useUpdateRack, useDeleteRack } from "@/hooks/use-rack"
import type { Rack } from "@/lib/type/rack"

const EMPTY_FORM = { codigo: "", ubicacion: "" }

export default function RackPage() {
  const { racks, isLoading, mutate } = useRacks()
  const { createRack, isLoading: isCreating } = useCreateRack()
  const { updateRack, isLoading: isUpdating } = useUpdateRack()
  const { deleteRack, isLoading: isDeleting } = useDeleteRack()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Rack | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = racks.filter((r: Rack) => {
    const q = search.toLowerCase()
    return (
      r.codigo.toLowerCase().includes(q) ||
      (r.ubicacion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(r: Rack) {
    setEditing(r)
    setForm({ codigo: r.codigo, ubicacion: r.ubicacion ?? "" })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.codigo.trim()) {
      toast.error("El código es obligatorio")
      return
    }
    try {
      const payload = {
        codigo: form.codigo.trim(),
        ubicacion: form.ubicacion.trim() || undefined,
      }
      if (editing) {
        await updateRack({ id: editing.id, ...payload })
        toast.success("Rack actualizado")
      } else {
        await createRack(payload)
        toast.success("Rack creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el rack")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRack(id)
      await mutate()
      toast.success("Rack desactivado")
    } catch {
      toast.error("Error al eliminar el rack")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Racks</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los racks de almacenamiento físico del depósito.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por código o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} rack{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo rack
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ubicación</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando racks...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron racks con ese criterio." : "No hay racks registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((r: Rack) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    {r.codigo}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.ubicacion ?? <span className="italic">—</span>}
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
            <SheetTitle>{editing ? "Editar rack" : "Nuevo rack"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos del rack "${editing.codigo}".`
                : "Completá los datos del nuevo rack."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Código</label>
              <Input
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                placeholder="Ej: RACK-A1, R-001..."
                maxLength={50}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Ubicación <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.ubicacion}
                onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))}
                placeholder="Ej: Depósito A, Sector 2, Pasillo 3..."
                maxLength={150}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear rack"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
