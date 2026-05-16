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
  usePallets,
  useCreatePallet,
  useUpdatePallet,
  useDeletePallet,
} from "@/hooks/use-pallet"
import { useRacks } from "@/hooks/use-rack"
import { useMediosAlmacenamiento } from "@/hooks/use-medio-almacenamiento"
import type { Pallet } from "@/lib/type/pallet"
import type { Rack } from "@/lib/type/rack"
import type { MedioAlmacenamiento } from "@/lib/type/medio-almacenamiento"

const EMPTY_FORM = { rackId: "", mdcId: "", codigo: "", statusKg: "" }

function medioLabel(m: MedioAlmacenamiento) {
  const partes = [`#${m.id}`]
  if (m.marca?.nombre) partes.push(m.marca.nombre)
  if (m.modelo?.nombre) partes.push(m.modelo.nombre)
  if (m.tipo?.nombre) partes.push(`(${m.tipo.nombre})`)
  return partes.join(" ")
}

export default function PalletPage() {
  const { pallets, isLoading, mutate } = usePallets()
  const { racks } = useRacks()
  const { medios } = useMediosAlmacenamiento()
  const { createPallet, isLoading: isCreating } = useCreatePallet()
  const { updatePallet, isLoading: isUpdating } = useUpdatePallet()
  const { deletePallet, isLoading: isDeleting } = useDeletePallet()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Pallet | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = pallets.filter((p: Pallet) => {
    const q = search.toLowerCase()
    const rack = p.rack ? `${p.rack.codigo} ${p.rack.ubicacion ?? ""}`.toLowerCase() : ""
    return (
      (p.codigo ?? "").toLowerCase().includes(q) ||
      rack.includes(q) ||
      String(p.rackId).includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(p: Pallet) {
    setEditing(p)
    setForm({
      rackId: String(p.rackId),
      mdcId: p.mdcId ? String(p.mdcId) : "",
      codigo: p.codigo ?? "",
      statusKg: p.statusKg !== null && p.statusKg !== undefined ? String(p.statusKg) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.rackId) {
      toast.error("El rack es obligatorio")
      return
    }
    try {
      const payload = {
        rackId: Number(form.rackId),
        mdcId: form.mdcId ? Number(form.mdcId) : undefined,
        codigo: form.codigo.trim() || undefined,
        statusKg: form.statusKg !== "" ? Number(form.statusKg) : undefined,
      }
      if (editing) {
        await updatePallet({ id: editing.id, ...payload })
        toast.success("Pallet actualizado")
      } else {
        await createPallet(payload)
        toast.success("Pallet creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el pallet")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePallet(id)
      await mutate()
      toast.success("Pallet desactivado")
    } catch {
      toast.error("Error al eliminar el pallet")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pallets</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los pallets almacenados en racks.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por código o rack..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} pallet{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo pallet
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rack</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Medio de almacenamiento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Peso (kg)</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando pallets...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron pallets con ese criterio." : "No hay pallets registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((p: Pallet) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    {p.codigo
                      ? <span className="font-mono text-xs">{p.codigo}</span>
                      : <span className="italic text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.rack ? (
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">{p.rack.codigo}</span>
                        {p.rack.ubicacion && (
                          <span className="text-xs text-muted-foreground">{p.rack.ubicacion}</span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">#{p.rackId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.medioAlmacenamiento ? (
                      <span className="font-mono text-xs">
                        #{p.medioAlmacenamiento.id}
                        {p.medioAlmacenamiento.marca?.nombre && (
                          <span className="ml-1 font-sans text-muted-foreground not-italic">
                            {p.medioAlmacenamiento.marca.nombre}
                            {p.medioAlmacenamiento.modelo?.nombre && ` ${p.medioAlmacenamiento.modelo.nombre}`}
                          </span>
                        )}
                      </span>
                    ) : p.mdcId ? (
                      <span className="font-mono text-xs text-muted-foreground">#{p.mdcId}</span>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.statusKg !== null && p.statusKg !== undefined
                      ? `${p.statusKg} kg`
                      : <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === p.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(p.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(p)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(p.id)}
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
            <SheetTitle>{editing ? "Editar pallet" : "Nuevo pallet"}</SheetTitle>
            <SheetDescription>
              {editing ? "Modificá los datos del pallet." : "Registrá un nuevo pallet en un rack."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Rack</label>
              <select
                value={form.rackId}
                onChange={(e) => setForm((f) => ({ ...f, rackId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar rack...</option>
                {racks.map((r: Rack) => (
                  <option key={r.id} value={r.id}>
                    {r.codigo}{r.ubicacion ? ` — ${r.ubicacion}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Medio de almacenamiento <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.mdcId}
                onChange={(e) => setForm((f) => ({ ...f, mdcId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin medio asignado</option>
                {medios.map((m: MedioAlmacenamiento) => (
                  <option key={m.id} value={m.id}>
                    {medioLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Código <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="Ej: PLT-001"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Peso (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 50.00"
                value={form.statusKg}
                onChange={(e) => setForm((f) => ({ ...f, statusKg: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear pallet"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
