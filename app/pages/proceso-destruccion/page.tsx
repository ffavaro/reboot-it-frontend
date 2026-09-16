"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
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
import {
  useMediosAlmacenamiento,
  useCreateMedioAlmacenamiento,
} from "@/hooks/use-medio-almacenamiento"
import {
  useMetodosDestruccion,
  useCreateMetodoDestruccion,
} from "@/hooks/use-metodo-destruccion"
import { useEstadosProcesoDestruccion } from "@/hooks/use-estado-proceso-destruccion"
import { useMateriales } from "@/hooks/use-material"
import { useTipos } from "@/hooks/use-tipo"
import { useMarcas } from "@/hooks/use-marca"
import { useModelos } from "@/hooks/use-modelo"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { ProcesoDestruccion } from "@/lib/type/proceso-destruccion"
import type { Empleado } from "@/lib/type/user"
import type { MedioAlmacenamiento } from "@/lib/type/medio-almacenamiento"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import type { Material } from "@/lib/type/material"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"
import type { Modelo } from "@/lib/type/modelo"
import { formatDate } from "@/lib/utils/helpers"

const EMPTY_FORM = {
  medioAlmacenamientoId: "",
  fecha: "",
  metodoDestruccionId: "",
  estadoId: "",
  empleadoId: "",
}

const EMPTY_QUICK_MEDIO = { materialId: "", tipoId: "", marcaId: "", modeloId: "", terminosUso: "" }
const EMPTY_QUICK_METODO = { nombre: "", descripcion: "" }

function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
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
  const { medios, mutate: mutateMedios } = useMediosAlmacenamiento()
  const { metodos, mutate: mutateMetodos } = useMetodosDestruccion()
  const { estados } = useEstadosProcesoDestruccion()
  const { materiales } = useMateriales()
  const { tipos } = useTipos()
  const { marcas } = useMarcas()
  const { modelos } = useModelos()
  const { createProceso, isLoading: isCreating } = useCreateProcesoDestruccion()
  const { updateProceso, isLoading: isUpdating } = useUpdateProcesoDestruccion()
  const { deleteProceso, isLoading: isDeleting } = useDeleteProcesoDestruccion()
  const { createMedio, isLoading: isCreatingMedio } = useCreateMedioAlmacenamiento()
  const { createMetodo, isLoading: isCreatingMetodo } = useCreateMetodoDestruccion()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProcesoDestruccion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [quickMedioOpen, setQuickMedioOpen] = useState(false)
  const [quickMetodoOpen, setQuickMetodoOpen] = useState(false)
  const [quickMedioForm, setQuickMedioForm] = useState(EMPTY_QUICK_MEDIO)
  const [quickMetodoForm, setQuickMetodoForm] = useState(EMPTY_QUICK_METODO)

  const empleadosTecnicos = empleados.filter((e: Empleado) => {
    const rol = e.rol?.nombre?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    return rol === "tecnico"
  })

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
    const estadoPendiente = estados.find((e: EstadoProcesoDestruccion) =>
      e.nombre.toLowerCase() === "pendiente",
    )
    setForm({
      ...EMPTY_FORM,
      fecha: todayISO(),
      estadoId: estadoPendiente ? String(estadoPendiente.id) : "",
    })
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
    if (!form.metodoDestruccionId) {
      toast.error("El método es obligatorio")
      return
    }
    if (!form.empleadoId) {
      toast.error("El empleado responsable es obligatorio")
      return
    }
    try {
      const payload = {
        medioAlmacenamientoId: Number(form.medioAlmacenamientoId),
        fecha: form.fecha || undefined,
        metodoDestruccionId: Number(form.metodoDestruccionId),
        estadoId: form.estadoId ? Number(form.estadoId) : undefined,
        empleadoId: Number(form.empleadoId),
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

  function openQuickMedio() {
    setQuickMedioForm(EMPTY_QUICK_MEDIO)
    setQuickMedioOpen(true)
  }

  function openQuickMetodo() {
    setQuickMetodoForm(EMPTY_QUICK_METODO)
    setQuickMetodoOpen(true)
  }

  async function handleSaveQuickMedio() {
    if (!quickMedioForm.materialId) {
      toast.error("El material es obligatorio")
      return
    }
    try {
      const nuevo = await createMedio({
        materialId: Number(quickMedioForm.materialId),
        tipoId: quickMedioForm.tipoId ? Number(quickMedioForm.tipoId) : undefined,
        marcaId: quickMedioForm.marcaId ? Number(quickMedioForm.marcaId) : undefined,
        modeloId: quickMedioForm.modeloId ? Number(quickMedioForm.modeloId) : undefined,
        terminosUso: quickMedioForm.terminosUso.trim() || undefined,
      })
      await mutateMedios()
      if (nuevo) setForm((f) => ({ ...f, medioAlmacenamientoId: String(nuevo.id) }))
      toast.success("Medio de almacenamiento creado")
      setQuickMedioOpen(false)
    } catch {
      toast.error("Error al crear el medio de almacenamiento")
    }
  }

  async function handleSaveQuickMetodo() {
    if (!quickMetodoForm.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    try {
      const nuevo = await createMetodo({
        nombre: quickMetodoForm.nombre.trim(),
        descripcion: quickMetodoForm.descripcion.trim() || undefined,
      })
      await mutateMetodos()
      if (nuevo) setForm((f) => ({ ...f, metodoDestruccionId: String(nuevo.id) }))
      toast.success("Método de destrucción creado")
      setQuickMetodoOpen(false)
    } catch {
      toast.error("Error al crear el método de destrucción")
    }
  }

  const canSave = !!form.medioAlmacenamientoId && !!form.metodoDestruccionId && !!form.empleadoId
  const canSaveQuickMedio = !!quickMedioForm.materialId
  const canSaveQuickMetodo = !!quickMetodoForm.nombre.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Procesos de Destrucción</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los procesos de destrucción segura de medios de almacenamiento.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por medio, método, estado o empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} proceso{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo proceso
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
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear proceso"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Medio de almacenamiento *</label>
          <div className="flex gap-2">
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
            {!isViewing && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="No está en la lista: crear nuevo medio de almacenamiento"
                onClick={openQuickMedio}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Método *</label>
          <div className="flex gap-2">
            <select
              value={form.metodoDestruccionId}
              onChange={(e) => setForm((f) => ({ ...f, metodoDestruccionId: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleccionar método...</option>
              {metodos.map((m: MetodoDestruccion) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            {!isViewing && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="No está en la lista: crear nuevo método"
                onClick={openQuickMetodo}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Estado</label>
          <select
            value={form.estadoId}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, estadoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Sin estado especificado</option>
            {estados.map((e: EstadoProcesoDestruccion) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fecha</label>
          <Input
            type="date"
            value={form.fecha}
            min={todayISO()}
            disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Empleado responsable *</label>
          <select
            value={form.empleadoId}
            onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar empleado...</option>
            {empleadosTecnicos.map((e: Empleado) => (
              <option key={e.id} value={e.id}>
                {e.nombre} {e.apellido}{e.cargo ? ` — ${e.cargo}` : ""}
              </option>
            ))}
          </select>
        </div>
      </FormModal>

      {/* Alta rápida de medio de almacenamiento */}
      <FormModal
        open={quickMedioOpen}
        onOpenChange={setQuickMedioOpen}
        title="Nuevo medio de almacenamiento"
        description="Cargá los datos del medio para asociarlo al proceso."
        onSave={handleSaveQuickMedio}
        isLoading={isCreatingMedio}
        saveDisabled={!canSaveQuickMedio}
        saveLabel="Crear medio"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Material *</label>
          <select
            value={quickMedioForm.materialId}
            onChange={(e) => setQuickMedioForm((f) => ({ ...f, materialId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar material...</option>
            {materiales.map((m: Material) => (
              <option key={m.id} value={m.id}>
                #{m.id}{m.tipoMaterial ? ` — ${m.tipoMaterial.nombre}` : ""}{m.descripcion ? ` (${m.descripcion})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Tipo <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={quickMedioForm.tipoId}
            onChange={(e) => setQuickMedioForm((f) => ({ ...f, tipoId: e.target.value }))}
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
            value={quickMedioForm.marcaId}
            onChange={(e) => setQuickMedioForm((f) => ({ ...f, marcaId: e.target.value }))}
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
            value={quickMedioForm.modeloId}
            onChange={(e) => setQuickMedioForm((f) => ({ ...f, modeloId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin modelo</option>
            {modelos
              .filter((mo: Modelo) => !quickMedioForm.marcaId || mo.marcaId === Number(quickMedioForm.marcaId))
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
            value={quickMedioForm.terminosUso}
            onChange={(e) => setQuickMedioForm((f) => ({ ...f, terminosUso: e.target.value }))}
            placeholder="Ej: Uso en ambiente seco, temperatura controlada..."
            maxLength={500}
          />
        </div>
      </FormModal>

      {/* Alta rápida de método de destrucción */}
      <FormModal
        open={quickMetodoOpen}
        onOpenChange={setQuickMetodoOpen}
        title="Nuevo método de destrucción"
        description="Cargá los datos del método para asociarlo al proceso."
        onSave={handleSaveQuickMetodo}
        isLoading={isCreatingMetodo}
        saveDisabled={!canSaveQuickMetodo}
        saveLabel="Crear método"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre *</label>
          <Input
            value={quickMetodoForm.nombre}
            onChange={(e) => setQuickMetodoForm((f) => ({ ...f, nombre: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre") }))}
            placeholder="Ej: Trituración física, Desmagnetización..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={quickMetodoForm.descripcion}
            onChange={(e) => setQuickMetodoForm((f) => ({ ...f, descripcion: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción") }))}
            placeholder="Descripción del método de destrucción..."
          />
        </div>
      </FormModal>
    </div>
  )
}
