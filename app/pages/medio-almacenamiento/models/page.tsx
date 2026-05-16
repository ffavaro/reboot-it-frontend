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
import { useModelos, useCreateModelo, useUpdateModelo, useDeleteModelo } from "@/hooks/use-modelo"
import { useTipos } from "@/hooks/use-tipo"
import { useMarcas } from "@/hooks/use-marca"
import type { Modelo } from "@/lib/type/modelo"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"

const EMPTY_FORM = { nombre: "", marcaId: "", tipoId: "" }

export default function ModelosPage() {
  const { modelos, isLoading, mutate } = useModelos()
  const { tipos } = useTipos()
  const { marcas } = useMarcas()
  const { createModelo, isLoading: isCreating } = useCreateModelo()
  const { updateModelo, isLoading: isUpdating } = useUpdateModelo()
  const { deleteModelo, isLoading: isDeleting } = useDeleteModelo()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Modelo | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = modelos.filter((m: Modelo) =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.marca?.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.tipo?.nombre ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(m: Modelo) {
    setEditing(m)
    setForm({ nombre: m.nombre, marcaId: String(m.marcaId), tipoId: String(m.tipoId) })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.marcaId || !form.tipoId) {
      toast.error("Nombre, marca y tipo son obligatorios")
      return
    }
    try {
      const payload = {
        nombre: form.nombre.trim(),
        marcaId: Number(form.marcaId),
        tipoId: Number(form.tipoId),
      }
      if (editing) {
        await updateModelo({ id: editing.id, ...payload })
        toast.success("Modelo actualizado")
      } else {
        await createModelo(payload)
        toast.success("Modelo creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el modelo")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteModelo(id)
      await mutate()
      toast.success("Modelo desactivado")
    } catch {
      toast.error("Error al eliminar el modelo")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Modelos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los modelos de medios de almacenamiento por marca y tipo.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre, marca o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} modelo{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo modelo
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando modelos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron modelos con ese criterio." : "No hay modelos registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((m: Modelo) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{m.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.marca?.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.tipo?.nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === m.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(m.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(m)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(m.id)}
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
            <SheetTitle>{editing ? "Editar modelo" : "Nuevo modelo"}</SheetTitle>
            <SheetDescription>
              {editing ? `Modificá los datos de "${editing.nombre}".` : "Completá los datos del nuevo modelo."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Barracuda 2TB, Blue 1TB..."
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Marca</label>
              <select
                value={form.marcaId}
                onChange={(e) => setForm((f) => ({ ...f, marcaId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar marca...</option>
                {marcas.map((m: Marca) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={form.tipoId}
                onChange={(e) => setForm((f) => ({ ...f, tipoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar tipo...</option>
                {tipos.map((t: Tipo) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear modelo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
