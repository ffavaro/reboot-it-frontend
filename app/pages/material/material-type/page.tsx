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
  useTipoMateriales,
  useCreateTipoMaterial,
  useUpdateTipoMaterial,
  useDeleteTipoMaterial,
} from "@/hooks/use-tipo-material"
import type { TipoMaterial } from "@/lib/type/tipo-material"

const EMPTY_FORM = { nombre: "", descripcion: "" }

export default function TipoMaterialPage() {
  const { tipoMateriales, isLoading, mutate } = useTipoMateriales()
  const { createTipoMaterial, isLoading: isCreating } = useCreateTipoMaterial()
  const { updateTipoMaterial, isLoading: isUpdating } = useUpdateTipoMaterial()
  const { deleteTipoMaterial, isLoading: isDeleting } = useDeleteTipoMaterial()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<TipoMaterial | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = tipoMateriales.filter(
    (t) =>
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (t.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(t: TipoMaterial) {
    setEditing(t)
    setForm({ nombre: t.nombre, descripcion: t.descripcion ?? "" })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateTipoMaterial({ id: editing.id, ...payload })
        toast.success("Tipo de material actualizado")
      } else {
        await createTipoMaterial(payload)
        toast.success("Tipo de material creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el tipo de material")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTipoMaterial(id)
      await mutate()
      toast.success("Tipo de material desactivado")
    } catch {
      toast.error("Error al eliminar el tipo de material")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Tipos de Material</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las categorías de materiales que ingresan al sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} tipo{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo tipo
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando tipos de material...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron tipos con ese criterio." : "No hay tipos de material registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{t.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate">
                    {t.descripcion ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === t.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => handleDelete(t.id)}
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
            <SheetTitle>{editing ? "Editar tipo de material" : "Nuevo tipo de material"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos de "${editing.nombre}".`
                : "Completá los datos del nuevo tipo de material."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Electrónico, Eléctrico, Batería..."
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
                placeholder="Breve descripción del tipo de material"
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
                  : "Crear tipo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}