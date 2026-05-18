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
  useRegistrosFotograficos,
  useCreateRegistroFotografico,
  useUpdateRegistroFotografico,
  useDeleteRegistroFotografico,
} from "@/hooks/use-registro-fotografico"
import { useLotes } from "@/hooks/use-lote"
import type { RegistroFotografico } from "@/lib/type/registro-fotografico"
import type { Lote } from "@/lib/type/lote"

const EMPTY_FORM = { loteId: "", urlImagen: "", fecha: "" }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function RegistroFotograficoPage() {
  const { registros, isLoading, mutate } = useRegistrosFotograficos()
  const { lotes } = useLotes()
  const { createRegistro, isLoading: isCreating } = useCreateRegistroFotografico()
  const { updateRegistro, isLoading: isUpdating } = useUpdateRegistroFotografico()
  const { deleteRegistro, isLoading: isDeleting } = useDeleteRegistroFotografico()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<RegistroFotografico | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = registros.filter((r: RegistroFotografico) => {
    const q = search.toLowerCase()
    return (
      String(r.loteId).includes(q) ||
      r.urlImagen.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(r: RegistroFotografico) {
    setEditing(r)
    setForm({
      loteId: String(r.loteId),
      urlImagen: r.urlImagen,
      fecha: r.fecha ? r.fecha.slice(0, 10) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.loteId || !form.urlImagen.trim()) {
      toast.error("El lote y la URL de imagen son obligatorios")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        urlImagen: form.urlImagen.trim(),
        fecha: form.fecha || undefined,
      }
      if (editing) {
        await updateRegistro({ id: editing.id, ...payload })
        toast.success("Registro fotográfico actualizado")
      } else {
        await createRegistro(payload)
        toast.success("Registro fotográfico creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el registro fotográfico")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRegistro(id)
      await mutate()
      toast.success("Registro fotográfico desactivado")
    } catch {
      toast.error("Error al eliminar el registro fotográfico")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Registro Fotográfico</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las imágenes asociadas a cada lote del sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote o URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo registro
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lote</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Imagen</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando registros fotográficos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron registros con ese criterio."
                    : "No hay registros fotográficos registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((r: RegistroFotografico) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium">
                    #{r.loteId}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.urlImagen}
                        alt={`Lote #${r.loteId}`}
                        className="h-10 w-10 rounded object-cover bg-muted flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                      <a
                        href={r.urlImagen}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline truncate max-w-[200px]"
                      >
                        {r.urlImagen}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(r.fecha) ?? <span className="italic">—</span>}
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
            <SheetTitle>{editing ? "Editar registro fotográfico" : "Nuevo registro fotográfico"}</SheetTitle>
            <SheetDescription>
              {editing
                ? `Modificá los datos del registro del lote #${editing.loteId}.`
                : "Agregá una nueva imagen asociada a un lote."}
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
              <label className="text-sm font-medium">URL de imagen</label>
              <Input
                value={form.urlImagen}
                onChange={(e) => setForm((f) => ({ ...f, urlImagen: e.target.value }))}
                placeholder="https://storage.ejemplo.com/fotos/imagen.jpg"
                maxLength={500}
              />
              {form.urlImagen && (
                <img
                  src={form.urlImagen}
                  alt="Vista previa"
                  className="mt-1 h-32 w-full rounded-md object-cover bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              )}
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
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear registro"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
