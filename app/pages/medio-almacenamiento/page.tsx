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
  useMediosAlmacenamiento,
  useCreateMedioAlmacenamiento,
  useUpdateMedioAlmacenamiento,
  useDeleteMedioAlmacenamiento,
} from "@/hooks/use-medio-almacenamiento"
import { useTipos } from "@/hooks/use-tipo"
import { useMarcas } from "@/hooks/use-marca"
import { useModelos } from "@/hooks/use-modelo"
import type { MedioAlmacenamiento } from "@/lib/type/medio-almacenamiento"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"
import type { Modelo } from "@/lib/type/modelo"

const EMPTY_FORM = {
  materialId: "",
  tipoId: "",
  marcaId: "",
  modeloId: "",
  terminosUso: "",
}

export default function MedioAlmacenamientoPage() {
  const { medios, isLoading, mutate } = useMediosAlmacenamiento()
  const { tipos } = useTipos()
  const { marcas } = useMarcas()
  const { modelos } = useModelos()
  const { createMedio, isLoading: isCreating } = useCreateMedioAlmacenamiento()
  const { updateMedio, isLoading: isUpdating } = useUpdateMedioAlmacenamiento()
  const { deleteMedio, isLoading: isDeleting } = useDeleteMedioAlmacenamiento()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<MedioAlmacenamiento | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = medios.filter((m: MedioAlmacenamiento) => {
    const q = search.toLowerCase()
    return (
      String(m.materialId).includes(q) ||
      (m.tipo?.nombre ?? "").toLowerCase().includes(q) ||
      (m.marca?.nombre ?? "").toLowerCase().includes(q) ||
      (m.modelo?.nombre ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(m: MedioAlmacenamiento) {
    setEditing(m)
    setForm({
      materialId: String(m.materialId),
      tipoId: m.tipoId ? String(m.tipoId) : "",
      marcaId: m.marcaId ? String(m.marcaId) : "",
      modeloId: m.modeloId ? String(m.modeloId) : "",
      terminosUso: m.terminosUso ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.materialId) {
      toast.error("El material es obligatorio")
      return
    }
    try {
      const payload = {
        materialId: Number(form.materialId),
        tipoId: form.tipoId ? Number(form.tipoId) : undefined,
        marcaId: form.marcaId ? Number(form.marcaId) : undefined,
        modeloId: form.modeloId ? Number(form.modeloId) : undefined,
        terminosUso: form.terminosUso.trim() || undefined,
      }
      if (editing) {
        await updateMedio({ id: editing.id, ...payload })
        toast.success("Medio de almacenamiento actualizado")
      } else {
        await createMedio(payload)
        toast.success("Medio de almacenamiento creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el medio de almacenamiento")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMedio(id)
      await mutate()
      toast.success("Medio de almacenamiento desactivado")
    } catch {
      toast.error("Error al eliminar el medio de almacenamiento")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Medios de Almacenamiento</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los medios de almacenamiento asociados a materiales del sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por material, tipo, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} medio{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo medio
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Material ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marca</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Modelo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Términos de uso</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando medios de almacenamiento...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron medios con ese criterio."
                    : "No hay medios de almacenamiento registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((m: MedioAlmacenamiento) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">{m.materialId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.tipo?.nombre ?? <span className="italic">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.marca?.nombre ?? <span className="italic">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.modelo?.nombre ?? <span className="italic">—</span>}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                    {m.terminosUso ?? <span className="italic">—</span>}
                  </td>
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
            <SheetTitle>{editing ? "Editar medio de almacenamiento" : "Nuevo medio de almacenamiento"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Modificá los datos del medio de almacenamiento."
                : "Completá los datos del nuevo medio de almacenamiento."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">ID de Material</label>
              <Input
                type="number"
                value={form.materialId}
                onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
                placeholder="Ej: 1"
                min={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Tipo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.tipoId}
                onChange={(e) => setForm((f) => ({ ...f, tipoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin tipo</option>
                {tipos.map((t: Tipo) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Marca <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.marcaId}
                onChange={(e) => setForm((f) => ({ ...f, marcaId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin marca</option>
                {marcas.map((m: Marca) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Modelo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.modeloId}
                onChange={(e) => setForm((f) => ({ ...f, modeloId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin modelo</option>
                {modelos
                  .filter((mo: Modelo) =>
                    !form.marcaId || mo.marcaId === Number(form.marcaId),
                  )
                  .map((mo: Modelo) => (
                    <option key={mo.id} value={mo.id}>{mo.nombre}</option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Términos de uso <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                value={form.terminosUso}
                onChange={(e) => setForm((f) => ({ ...f, terminosUso: e.target.value }))}
                placeholder="Ej: Uso en ambiente seco, temperatura controlada..."
                maxLength={500}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear medio"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
