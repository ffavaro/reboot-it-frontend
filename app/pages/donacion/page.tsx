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
  useDonaciones,
  useCreateDonacion,
  useUpdateDonacion,
  useDeleteDonacion,
} from "@/hooks/use-donacion"
import { useDonantes } from "@/hooks/use-donantes"
import type { Donacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"

const ESTADOS = ["Pendiente", "En proceso", "Completada", "Cancelada"]

const EMPTY_FORM = { donanteId: "", descripcion: "", estado: "" }

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: "bg-yellow-100 text-yellow-800",
  "En proceso": "bg-blue-100 text-blue-800",
  Completada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-800",
}

export default function DonacionPage() {
  const { donaciones, isLoading, mutate } = useDonaciones()
  const { donantes } = useDonantes()
  const { createDonacion, isLoading: isCreating } = useCreateDonacion()
  const { updateDonacion, isLoading: isUpdating } = useUpdateDonacion()
  const { deleteDonacion, isLoading: isDeleting } = useDeleteDonacion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Donacion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = donaciones.filter((d: Donacion) => {
    const q = search.toLowerCase()
    const donante = d.donante?.nombre?.toLowerCase() ?? ""
    return (
      donante.includes(q) ||
      (d.estado ?? "").toLowerCase().includes(q) ||
      (d.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(d: Donacion) {
    setEditing(d)
    setForm({
      donanteId: String(d.donanteId),
      descripcion: d.descripcion ?? "",
      estado: d.estado ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.donanteId) {
      toast.error("El donante es obligatorio")
      return
    }
    try {
      const payload = {
        donanteId: Number(form.donanteId),
        descripcion: form.descripcion.trim() || undefined,
        estado: form.estado || undefined,
      }
      if (editing) {
        await updateDonacion({ id: editing.id, ...payload })
        toast.success("Donación actualizada")
      } else {
        await createDonacion(payload)
        toast.success("Donación creada")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar la donación")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteDonacion(id)
      await mutate()
      toast.success("Donación desactivada")
    } catch {
      toast.error("Error al eliminar la donación")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Donaciones</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las donaciones registradas por donante.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por donante, estado o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} donación{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva donación
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Donante</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando donaciones...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron donaciones con ese criterio." : "No hay donaciones registradas."}
                </td>
              </tr>
            ) : (
              filtered.map((d: Donacion) => (
                <tr
                  key={d.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">#{d.id}</td>
                  <td className="px-4 py-3">
                    {d.donante?.nombre ?? (
                      <span className="italic text-muted-foreground">#{d.donanteId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.estado ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[d.estado] ?? "bg-gray-100 text-gray-800"}`}>
                        {d.estado}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[260px] truncate text-muted-foreground">
                    {d.descripcion ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === d.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(d.id)} disabled={isDeleting}>
                            Eliminar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => openEdit(d)}>
                            Editar
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(d.id)}
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
            <SheetTitle>{editing ? "Editar donación" : "Nueva donación"}</SheetTitle>
            <SheetDescription>
              {editing ? "Modificá los datos de la donación." : "Registrá una nueva donación."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Donante</label>
              <select
                value={form.donanteId}
                onChange={(e) => setForm((f) => ({ ...f, donanteId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar donante...</option>
                {donantes.map((d: Donante) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Estado <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin estado</option>
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Descripción de la donación..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear donación"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
