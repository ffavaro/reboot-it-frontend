"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useMetodosDestruccion,
  useCreateMetodoDestruccion,
  useUpdateMetodoDestruccion,
  useDeleteMetodoDestruccion,
} from "@/hooks/use-metodo-destruccion"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required } from "@/lib/form-validators"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"

const EMPTY_FORM = { nombre: "", descripcion: "" }

const COLUMNS: TableColumn<MetodoDestruccion>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (m) => (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
        {m.nombre}
      </span>
    ),
  },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (m) =>
      m.descripcion
        ? <span className="text-sm text-muted-foreground">{m.descripcion}</span>
        : <span className="italic text-muted-foreground">—</span>,
  },
]

export default function MetodoDestruccionPage() {
  const { metodos, isLoading, mutate } = useMetodosDestruccion()
  const { createMetodo, isLoading: isCreating } = useCreateMetodoDestruccion()
  const { updateMetodo, isLoading: isUpdating } = useUpdateMetodoDestruccion()
  const { deleteMetodo, isLoading: isDeleting } = useDeleteMetodoDestruccion()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MetodoDestruccion | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = metodos.filter((m: MetodoDestruccion) =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    reset()
    setModalOpen(true)
  }

  function openEdit(m: MetodoDestruccion) {
    setIsViewing(false)
    setEditing(m)
    setForm({ nombre: m.nombre, descripcion: m.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  function openView(m: MetodoDestruccion) {
    setIsViewing(true)
    setEditing(m)
    setForm({ nombre: m.nombre, descripcion: m.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, { nombre: [required("el nombre")] })) return
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateMetodo({ id: editing.id, ...payload })
        toast.success("Método actualizado")
      } else {
        await createMetodo(payload)
        toast.success("Método creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el método")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteMetodo(id as number)
      await mutate()
      toast.success("Método desactivado")
    } catch {
      toast.error("Error al eliminar el método")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Métodos de Destrucción</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los métodos de destrucción segura disponibles (Trituración, Desmagnetización, etc.).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} método{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo método
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando métodos de destrucción..."
        emptyText="No hay métodos de destrucción registrados."
        emptySearchText="No se encontraron métodos con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={
          isViewing
            ? "Ver método de destrucción"
            : editing
              ? "Editar método de destrucción"
              : "Nuevo método de destrucción"
        }
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo método de destrucción."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear método"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej: Trituración física, Desmagnetización..."
            maxLength={100}
            className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.nombre}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Descripción del método de destrucción..."
            maxLength={255}
          />
        </div>
      </FormModal>
    </div>
  )
}
