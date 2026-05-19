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
  useTurnos,
  useCreateTurno,
  useUpdateTurno,
  useDeleteTurno,
} from "@/hooks/use-turno"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosTurno } from "@/hooks/use-estado-turno"
import type { Turno } from "@/lib/type/turno"
import type { Donante } from "@/lib/type/donante"
import type { EstadoTurno } from "@/lib/type/estado-turno"

const EMPTY_FORM = { donanteId: "", estadoTurnoId: "", fechaHora: "", descripcion: "" }

function formatDateTime(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function TurnoPage() {
  const { turnos, isLoading, mutate } = useTurnos()
  const { donantes } = useDonantes()
  const { estadosTurno } = useEstadosTurno()
  const { createTurno, isLoading: isCreating } = useCreateTurno()
  const { updateTurno, isLoading: isUpdating } = useUpdateTurno()
  const { deleteTurno, isLoading: isDeleting } = useDeleteTurno()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Turno | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = turnos.filter((t: Turno) => {
    const q = search.toLowerCase()
    const donante = t.donante?.nombre?.toLowerCase() ?? ""
    const estado = t.estadoTurno?.descripcion?.toLowerCase() ?? ""
    return (
      donante.includes(q) ||
      estado.includes(q) ||
      (t.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(t: Turno) {
    setEditing(t)
    setForm({
      donanteId: String(t.donanteId),
      estadoTurnoId: String(t.estadoTurnoId),
      fechaHora: t.fechaHora ? t.fechaHora.slice(0, 16) : "",
      descripcion: t.descripcion ?? "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.donanteId || !form.estadoTurnoId || !form.fechaHora) {
      toast.error("Donante, estado y fecha/hora son obligatorios")
      return
    }
    try {
      const payload = {
        donanteId: Number(form.donanteId),
        estadoTurnoId: Number(form.estadoTurnoId),
        fechaHora: form.fechaHora,
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateTurno({ id: editing.id, ...payload })
        toast.success("Turno actualizado")
      } else {
        await createTurno(payload)
        toast.success("Turno creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el turno")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTurno(id)
      await mutate()
      toast.success("Turno desactivado")
    } catch {
      toast.error("Error al eliminar el turno")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los turnos asignados a donantes.
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
          {filtered.length} turno{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo turno
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Donante</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha y hora</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando turnos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? "No se encontraron turnos con ese criterio." : "No hay turnos registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((t: Turno) => (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    {t.donante?.nombre ?? (
                      <span className="italic text-muted-foreground">#{t.donanteId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.estadoTurno?.descripcion ? (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {t.estadoTurno.descripcion}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(t.fechaHora) ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground">
                    {t.descripcion ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {deletingId === t.id ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Confirmar?</span>
                          <Button size="xs" variant="destructive" onClick={() => handleDelete(t.id)} disabled={isDeleting}>
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
            <SheetTitle>{editing ? "Editar turno" : "Nuevo turno"}</SheetTitle>
            <SheetDescription>
              {editing ? "Modificá los datos del turno." : "Registrá un nuevo turno para un donante."}
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
              <label className="text-sm font-medium">Estado</label>
              <select
                value={form.estadoTurnoId}
                onChange={(e) => setForm((f) => ({ ...f, estadoTurnoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar estado...</option>
                {estadosTurno.map((e: EstadoTurno) => (
                  <option key={e.id} value={e.id}>{e.descripcion}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Fecha y hora</label>
              <Input
                type="datetime-local"
                value={form.fechaHora}
                onChange={(e) => setForm((f) => ({ ...f, fechaHora: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="Observaciones del turno..."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating ? "Guardando..." : editing ? "Guardar cambios" : "Crear turno"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
