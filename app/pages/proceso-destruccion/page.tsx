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
import { useMetodosDestruccion } from "@/hooks/use-metodo-destruccion"
import { useEstadosProcesoDestruccion } from "@/hooks/use-estado-proceso-destruccion"
import type { ProcesoDestruccion } from "@/lib/type/proceso-destruccion"
import type { Empleado } from "@/lib/type/user"
import type { MedioAlmacenamiento } from "@/lib/type/medio-almacenamiento"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import { formatDate } from "@/lib/utils/helpers"

const EMPTY_FORM = {
  medioAlmacenamientoId: "",
  fecha: "",
  metodoDestruccionId: "",
  estadoId: "",
  empleadoId: "",
}

const ESTADO_COLORS: Record<string, string> = {
  Iniciado: "bg-blue-100 text-blue-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
  Finalizado: "bg-green-100 text-green-800",
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
    cell: (p) => {
      const m = p.medioAlmacenamiento
      const tipoMaterial = m?.material?.tipoMaterial?.nombre
      const descripcion = m?.material?.descripcion
      const marca = m?.marca?.nombre
      const modelo = m?.modelo?.nombre
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-muted-foreground">#{p.medioAlmacenamientoId}</span>
          {tipoMaterial && (
            <span className="text-sm font-medium">
              {tipoMaterial}
              {marca && ` · ${marca}`}
              {modelo && ` ${modelo}`}
            </span>
          )}
          {descripcion && (
            <span className="text-xs text-muted-foreground truncate max-w-55">{descripcion}</span>
          )}
        </div>
      )
    },
  },
  {
    key: "metodo",
    header: "Método",
    cell: (p) =>
      p.metodoDestruccion ? (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
          {p.metodoDestruccion.nombre}
        </span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "estado",
    header: "Estado",
    cell: (p) => {
      const nombre = p.estado?.nombre ?? ""
      const color = ESTADO_COLORS[nombre] ?? "bg-gray-100 text-gray-800"
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
          {nombre || "—"}
        </span>
      )
    },
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
  const { metodos } = useMetodosDestruccion()
  const { estados } = useEstadosProcesoDestruccion()
  const { createProceso, isLoading: isCreating } = useCreateProcesoDestruccion()
  const { updateProceso, isLoading: isUpdating } = useUpdateProcesoDestruccion()
  const { deleteProceso, isLoading: isDeleting } = useDeleteProcesoDestruccion()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProcesoDestruccion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = procesos.filter((p: ProcesoDestruccion) => {
    const q = search.toLowerCase()
    const empleado = p.empleado ? `${p.empleado.nombre} ${p.empleado.apellido}`.toLowerCase() : ""
    const metodo = p.metodoDestruccion?.nombre.toLowerCase() ?? ""
    const estado = p.estado?.nombre.toLowerCase() ?? ""
    return (
      String(p.medioAlmacenamientoId).includes(q) ||
      metodo.includes(q) ||
      estado.includes(q) ||
      empleado.includes(q)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(p: ProcesoDestruccion) {
    setIsViewing(false)
    setEditing(p)
    setForm({
      medioAlmacenamientoId: String(p.medioAlmacenamientoId),
      fecha: p.fecha ? p.fecha.slice(0, 10) : "",
      metodoDestruccionId: p.metodoDestruccionId ? String(p.metodoDestruccionId) : "",
      estadoId: p.estadoId ? String(p.estadoId) : "",
      empleadoId: p.empleadoId ? String(p.empleadoId) : "",
    })
    setModalOpen(true)
  }

  function openView(p: ProcesoDestruccion) {
    setIsViewing(true)
    setEditing(p)
    setForm({
      medioAlmacenamientoId: String(p.medioAlmacenamientoId),
      fecha: p.fecha ? p.fecha.slice(0, 10) : "",
      metodoDestruccionId: p.metodoDestruccionId ? String(p.metodoDestruccionId) : "",
      estadoId: p.estadoId ? String(p.estadoId) : "",
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
        metodoDestruccionId: form.metodoDestruccionId ? Number(form.metodoDestruccionId) : undefined,
        estadoId: form.estadoId ? Number(form.estadoId) : undefined,
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
          placeholder="Buscar por medio, método, estado o empleado..."
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
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver proceso de destrucción" : editing ? "Editar proceso de destrucción" : "Nuevo proceso de destrucción"}
        readOnly={isViewing}
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
            value={form.metodoDestruccionId}
            onChange={(e) => setForm((f) => ({ ...f, metodoDestruccionId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin método especificado</option>
            {metodos.map((m: MetodoDestruccion) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Estado <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.estadoId}
            onChange={(e) => setForm((f) => ({ ...f, estadoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin estado especificado</option>
            {estados.map((e: EstadoProcesoDestruccion) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
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
