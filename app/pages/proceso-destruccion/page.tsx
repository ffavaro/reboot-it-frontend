"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
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

const columns: TableColumn<ProcesoDestruccion>[] = [
  {
    key: "medio",
    header: "Medio de almacenamiento",
    cell: (p) => (
      <span className="font-mono text-xs">
        #{p.medioAlmacenamientoId}
        {p.medioAlmacenamiento?.marca?.nombre && (
          <span className="ml-2 font-sans text-muted-foreground not-italic">
            {p.medioAlmacenamiento.marca.nombre}
            {p.medioAlmacenamiento.modelo?.nombre && ` ${p.medioAlmacenamiento.modelo.nombre}`}
          </span>
        )}
      </span>
    ),
  },
  {
    key: "metodo",
    header: "Método",
    cell: (p) =>
      p.metodo ? (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
          {p.metodo}
        </span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "fecha",
    header: "Fecha",
    cell: (p) => (
      <span className="text-muted-foreground">
        {formatDate(p.fecha) ?? <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "empleado",
    header: "Empleado",
    cell: (p) =>
      p.empleado
        ? `${p.empleado.nombre} ${p.empleado.apellido}`
        : <span className="italic text-muted-foreground">—</span>,
  },
]

export default function ProcesoDestruccionPage() {
  const { procesos, isLoading, mutate } = useProcesosDestruccion()
  const { empleados } = useEmpleadosFull()
  const { medios } = useMediosAlmacenamiento()
  const { createProceso, isLoading: isCreating } = useCreateProcesoDestruccion()
  const { updateProceso, isLoading: isUpdating } = useUpdateProcesoDestruccion()
  const { deleteProceso, isLoading: isDeleting } = useDeleteProcesoDestruccion()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProcesoDestruccion | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

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
    setModalOpen(true)
  }

  function openEdit(p: ProcesoDestruccion) {
    setEditing(p)
    setForm({
      medioAlmacenamientoId: String(p.medioAlmacenamientoId),
      fecha: p.fecha ? p.fecha.slice(0, 10) : "",
      metodo: p.metodo ?? "",
      empleadoId: p.empleadoId ? String(p.empleadoId) : "",
    })
    setModalOpen(true)
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
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el proceso de destrucción")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteProceso(Number(id))
      await mutate()
      toast.success("Proceso de destrucción desactivado")
    } catch {
      toast.error("Error al eliminar el proceso de destrucción")
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

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando procesos de destrucción..."
        emptyText="No hay procesos de destrucción registrados."
        emptySearchText="No se encontraron procesos con ese criterio."
        search={search}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar proceso de destrucción" : "Nuevo proceso de destrucción"}
        description={
          editing
            ? "Modificá los datos del proceso de destrucción."
            : "Registrá un nuevo proceso de destrucción segura."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear proceso"}
      >
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
      </FormModal>
    </div>
  )
}
