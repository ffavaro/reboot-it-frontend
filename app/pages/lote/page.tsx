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
  useLotes,
  useCreateLote,
  useUpdateLote,
  useDeleteLote,
} from "@/hooks/use-lote"
import type { Lote } from "@/lib/type/lote"

const EMPTY_FORM = { donacionId: "", pesoBrutoKg: "", observaciones: "" }

export default function LotePage() {
  const { lotes, isLoading, mutate } = useLotes()
  const { createLote, isLoading: isCreating } = useCreateLote()
  const { updateLote, isLoading: isUpdating } = useUpdateLote()
  const { deleteLote, isLoading: isDeleting } = useDeleteLote()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Lote | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = lotes.filter((l: Lote) => {
    const q = search.toLowerCase()
    return (
      String(l.donacionId).includes(q) ||
      String(l.id).includes(q) ||
      (l.observaciones ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(l: Lote) {
    setEditing(l)
    setForm({
      donacionId: String(l.donacionId),
      pesoBrutoKg: l.pesoBrutoKg !== null && l.pesoBrutoKg !== undefined ? String(l.pesoBrutoKg) : "",
      observaciones: l.observaciones ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.donacionId) {
      toast.error("La donación es obligatoria")
      return
    }
    try {
      const payload = {
        donacionId: Number(form.donacionId),
        pesoBrutoKg: form.pesoBrutoKg !== "" ? Number(form.pesoBrutoKg) : undefined,
        observaciones: form.observaciones.trim() || undefined,
      }
      if (editing) {
        await updateLote({ id: editing.id, ...payload })
        toast.success("Lote actualizado")
      } else {
        await createLote(payload)
        toast.success("Lote creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el lote")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteLote(id)
      await mutate()
      toast.success("Lote desactivado")
    } catch {
      toast.error("Error al eliminar el lote")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Lotes</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los lotes de materiales asociados a donaciones.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por ID, donación u observaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} lote{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo lote
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Donación</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Peso bruto (kg)</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Observaciones</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando lotes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron lotes con ese criterio." : "No hay lotes registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((l: Lote) => (
                <tr
                  key={l.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">#{l.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">#{l.donacionId}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.pesoBrutoKg !== null && l.pesoBrutoKg !== undefined
                      ? `${l.pesoBrutoKg} kg`
                      : <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[300px] truncate text-muted-foreground">
                    {l.observaciones ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === l.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(l.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(l)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(l.id)}
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
            <SheetTitle>{editing ? "Editar lote" : "Nuevo lote"}</SheetTitle>
            <SheetDescription>
              {editing ? "Modificá los datos del lote." : "Registrá un nuevo lote de materiales."}
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
              <label className="text-sm font-medium">
                Peso bruto (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 120.50"
                value={form.pesoBrutoKg}
                onChange={(e) => setForm((f) => ({ ...f, pesoBrutoKg: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Observaciones <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Observaciones sobre el lote..."
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear lote"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
