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
  useMateriales,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from "@/hooks/use-material"
import { useLotes } from "@/hooks/use-lote"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import type { Material } from "@/lib/type/material"
import type { Lote } from "@/lib/type/lote"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"

const EMPTY_FORM = { loteId: "", tipoMaterialId: "", condicionMaterialId: "", descripcion: "" }

export default function MaterialPage() {
  const { materiales, isLoading, mutate } = useMateriales()
  const { lotes } = useLotes()
  const { tipoMateriales } = useTipoMateriales()
  const { condiciones } = useCondicionesMaterial()
  const { createMaterial, isLoading: isCreating } = useCreateMaterial()
  const { updateMaterial, isLoading: isUpdating } = useUpdateMaterial()
  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = materiales.filter((m: Material) => {
    const q = search.toLowerCase()
    const tipo = m.tipoMaterial?.nombre?.toLowerCase() ?? ""
    const condicion = m.condicionMaterial?.condicion?.toLowerCase() ?? ""
    return (
      String(m.loteId).includes(q) ||
      tipo.includes(q) ||
      condicion.includes(q) ||
      (m.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(m: Material) {
    setEditing(m)
    setForm({
      loteId: String(m.loteId),
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: String(m.condicionMaterialId),
      descripcion: m.descripcion ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.loteId || !form.tipoMaterialId || !form.condicionMaterialId) {
      toast.error("Lote, tipo de material y condición son obligatorios")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        tipoMaterialId: Number(form.tipoMaterialId),
        condicionMaterialId: Number(form.condicionMaterialId),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateMaterial({ id: editing.id, ...payload })
        toast.success("Material actualizado")
      } else {
        await createMaterial(payload)
        toast.success("Material creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el material")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMaterial(id)
      await mutate()
      toast.success("Material desactivado")
    } catch {
      toast.error("Error al eliminar el material")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los materiales registrados por lote.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote, tipo, condición o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} material{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo material
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lote</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo de material</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condición</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando materiales...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron materiales con ese criterio." : "No hay materiales registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((m: Material) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">#{m.loteId}</td>
                  <td className="px-4 py-3">
                    {m.tipoMaterial?.nombre ?? (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.condicionMaterial?.condicion ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {m.condicionMaterial.condicion}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[240px] truncate text-muted-foreground">
                    {m.descripcion ?? <span className="italic">—</span>}
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
            <SheetTitle>{editing ? "Editar material" : "Nuevo material"}</SheetTitle>
            <SheetDescription>
              {editing ? "Modificá los datos del material." : "Registrá un nuevo material en un lote."}
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
                    #{l.id} — Donación #{l.donacionId}
                    {l.pesoBrutoKg ? ` (${l.pesoBrutoKg} kg)` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Tipo de material</label>
              <select
                value={form.tipoMaterialId}
                onChange={(e) => setForm((f) => ({ ...f, tipoMaterialId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar tipo...</option>
                {tipoMateriales.map((t: TipoMaterial) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Condición</label>
              <select
                value={form.condicionMaterialId}
                onChange={(e) => setForm((f) => ({ ...f, condicionMaterialId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar condición...</option>
                {condiciones.map((c: CondicionMaterial) => (
                  <option key={c.id} value={c.id}>{c.condicion}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="Descripción del material..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear material"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
