"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useClasificaciones,
  useCreateClasificacion,
  useUpdateClasificacion,
  useDeleteClasificacion,
} from "@/hooks/use-clasificacion"
import { useLotes } from "@/hooks/use-lote"
import { useEmpleadosFull } from "@/hooks/use-employees"
import type { Clasificacion } from "@/lib/type/clasificacion"
import type { Lote } from "@/lib/type/lote"
import type { Empleado } from "@/lib/type/user"

const EMPTY_FORM = { loteId: "", fecha: "", empleadoId: "" }

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const columns: TableColumn<Clasificacion>[] = [
  {
    key: "loteId",
    header: "Lote",
    cell: (c) => <span className="font-mono text-xs font-medium">#{c.loteId}</span>,
  },
  {
    key: "fecha",
    header: "Fecha",
    cell: (c) => (
      <span className="text-muted-foreground">
        {formatDate(c.fecha) ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "empleado",
    header: "Inspector",
    cell: (c) =>
      c.empleado
        ? `${c.empleado.nombre} ${c.empleado.apellido}`
        : <span className="italic text-muted-foreground">Sin asignar</span>,
  },
]

export default function ClasificacionPage() {
  const { clasificaciones, isLoading, mutate } = useClasificaciones()
  const { lotes } = useLotes()
  const { empleados } = useEmpleadosFull()
  const { createClasificacion, isLoading: isCreating } = useCreateClasificacion()
  const { updateClasificacion, isLoading: isUpdating } = useUpdateClasificacion()
  const { deleteClasificacion, isLoading: isDeleting } = useDeleteClasificacion()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Clasificacion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = clasificaciones.filter((c: Clasificacion) => {
    const q = search.toLowerCase()
    const empleado = c.empleado
      ? `${c.empleado.nombre} ${c.empleado.apellido}`.toLowerCase()
      : ""
    return String(c.loteId).includes(q) || empleado.includes(q)
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(c: Clasificacion) {
    setIsViewing(false)
    setEditing(c)
    setForm({
      loteId: String(c.loteId),
      fecha: c.fecha ? c.fecha.slice(0, 10) : "",
      empleadoId: c.empleadoId ? String(c.empleadoId) : "",
    })
    setModalOpen(true)
  }

  function openView(c: Clasificacion) {
    setIsViewing(true)
    setEditing(c)
    setForm({
      loteId: String(c.loteId),
      fecha: c.fecha ? c.fecha.slice(0, 10) : "",
      empleadoId: c.empleadoId ? String(c.empleadoId) : "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.loteId) {
      toast.error("El lote es obligatorio")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        fecha: form.fecha || undefined,
        empleadoId: form.empleadoId ? Number(form.empleadoId) : undefined,
      }
      if (editing) {
        await updateClasificacion({ id: editing.id, ...payload })
        toast.success("Clasificación actualizada")
      } else {
        await createClasificacion(payload)
        toast.success("Clasificación creada")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar la clasificación")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteClasificacion(Number(id))
      await mutate()
      toast.success("Clasificación desactivada")
    } catch {
      toast.error("Error al eliminar la clasificación")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Clasificaciones</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las clasificaciones de lotes realizadas por empleadoes.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote o empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} clasificación{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva clasificación
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando clasificaciones..."
        emptyText="No hay clasificaciones registradas."
        emptySearchText="No se encontraron clasificaciones con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver clasificación" : editing ? "Editar clasificación" : "Nueva clasificación"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de la clasificación del lote #${editing.loteId}.`
            : "Registrá una nueva clasificación de lote."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear clasificación"}
      >
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
            Inspector <span className="text-muted-foreground font-normal">(opcional)</span>
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
      </FormModal>
    </div>
  )
}
