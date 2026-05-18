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
  useProcesosDestruccion,
  useCreateProcesoDestruccion,
  useUpdateProcesoDestruccion,
  useDeleteProcesoDestruccion,
} from "@/hooks/use-proceso-destruccion"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { useMediosAlmacenamiento } from "@/hooks/use-medio-almacenamiento"
import type { ProcesoDestruccion } from "@/lib/type/proceso-destruccion"
import type { Empleado } from "@/lib/type/user"
import type { MedioAlmacenamiento } from "@/lib/type/medio-almacenamiento"

const EMPTY_FORM = { medioAlmacenamientoId: "", fecha: "", metodo: "", empleadoId: "" }

const METODOS = ["Trituración", "Desmagnetización", "Incineración", "Sobreescritura", "Fragmentación"]

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function medioLabel(m: MedioAlmacenamiento) {
  const partes = [`#${m.id}`]
  if (m.marca?.nombre) partes.push(m.marca.nombre)
  if (m.modelo?.nombre) partes.push(m.modelo.nombre)
  if (m.tipo?.nombre) partes.push(`(${m.tipo.nombre})`)
  return partes.join(" ")
}

export default function ProcesoDestruccionPage() {
  const { procesos, isLoading, mutate } = useProcesosDestruccion()
  const { empleados } = useEmpleadosFull()
  const { medios } = useMediosAlmacenamiento()
  const { createProceso, isLoading: isCreating } = useCreateProcesoDestruccion()
  const { updateProceso, isLoading: isUpdating } = useUpdateProcesoDestruccion()
  const { deleteProceso, isLoading: isDeleting } = useDeleteProcesoDestruccion()

  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ProcesoDestruccion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = procesos.filter((p: ProcesoDestruccion) => {
    const q = search.toLowerCase()
    const empleado = p.empleado ? `${p.empleado.nombre} ${p.empleado.apellido}`.toLowerCase() : ""
    return (
      String(p.medioAlmacenamientoId).includes(q) ||
      (p.metodo ?? "").toLowerCase().includes(q) ||
      empleado.includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSheetOpen(true)
  }

  function openEdit(p: ProcesoDestruccion) {
    setEditing(p)
    setForm({
      medioAlmacenamientoId: String(p.medioAlmacenamientoId),
      fecha: p.fecha ? p.fecha.slice(0, 10) : "",
      metodo: p.metodo ?? "",
      empleadoId: p.empleadoId ? String(p.empleadoId) : "",
    })
    setSheetOpen(true)
  }

  async function handleSave() {
    if (!form.medioAlmacenamientoId) {
      toast.error("El medio de almacenamiento es obligatorio")
      return
    }
    try {
      const payload = {
        medioAlmacenamientoId: Number(form.medioAlmacenamientoId),
        fecha: form.fecha || undefined,
        metodo: form.metodo.trim() || undefined,
        empleadoId: form.empleadoId ? Number(form.empleadoId) : undefined,
      }
      if (editing) {
        await updateProceso({ id: editing.id, ...payload })
        toast.success("Proceso de destrucción actualizado")
      } else {
        await createProceso(payload)
        toast.success("Proceso de destrucción creado")
      }
      await mutate()
      setSheetOpen(false)
    } catch {
      toast.error("Error al guardar el proceso de destrucción")
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProceso(id)
      await mutate()
      toast.success("Proceso de destrucción desactivado")
    } catch {
      toast.error("Error al eliminar el proceso de destrucción")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Procesos de Destrucción</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los procesos de destrucción segura de medios de almacenamiento.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por medio, método o empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} proceso{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo proceso
        </Button>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Medio de almacenamiento</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Método</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empleado</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  Cargando procesos de destrucción...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  {search
                    ? "No se encontraron procesos con ese criterio."
                    : "No hay procesos de destrucción registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((p: ProcesoDestruccion) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    #{p.medioAlmacenamientoId}
                    {p.medioAlmacenamiento?.marca?.nombre && (
                      <span className="ml-2 font-sans text-muted-foreground not-italic">
                        {p.medioAlmacenamiento.marca.nombre}
                        {p.medioAlmacenamiento.modelo?.nombre && ` ${p.medioAlmacenamiento.modelo.nombre}`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.metodo ? (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                        {p.metodo}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.fecha) ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.empleado
                      ? `${p.empleado.nombre} ${p.empleado.apellido}`
                      : <span className="italic text-muted-foreground">—</span>}
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
            <SheetTitle>{editing ? "Editar proceso de destrucción" : "Nuevo proceso de destrucción"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Modificá los datos del proceso de destrucción."
                : "Registrá un nuevo proceso de destrucción segura."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Medio de almacenamiento</label>
              <select
                value={form.medioAlmacenamientoId}
                onChange={(e) => setForm((f) => ({ ...f, medioAlmacenamientoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar medio...</option>
                {medios.map((m: MedioAlmacenamiento) => (
                  <option key={m.id} value={m.id}>
                    {medioLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Método <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.metodo}
                onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin método especificado</option>
                {METODOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Empleado responsable <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={form.empleadoId}
                onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sin empleado asignado</option>
                {empleados.map((e: Empleado) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SheetFooter>
            <Button onClick={handleSave} disabled={isCreating || isUpdating} className="w-full">
              {isCreating || isUpdating
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear proceso"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
