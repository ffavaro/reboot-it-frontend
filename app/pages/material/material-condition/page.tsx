"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useCondicionesMaterial,
  useCreateCondicionMaterial,
  useUpdateCondicionMaterial,
  useDeleteCondicionMaterial,
} from "@/hooks/use-condicion-material"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required } from "@/lib/form-validators"
import type { CondicionMaterial } from "@/lib/type/condicion-material"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { condicion: "", descripcion: "" }

const BADGE_COLORS: Record<string, string> = {
  funcional:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  reparable:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  obsoleto:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  irreparable: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function CondicionBadge({ condicion }: { condicion: string }) {
  const cls = BADGE_COLORS[condicion.toLowerCase()] ?? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {condicion}
    </span>
  )
}

const COLUMNS: TableColumn<CondicionMaterial>[] = [
  {
    key: "condicion",
    header: "Condición",
    cell: (c) => <CondicionBadge condicion={c.condicion} />,
  },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (c) => (
      <span className="text-muted-foreground">
        {c.descripcion ?? <span className="italic">—</span>}
      </span>
    ),
    className: "max-w-md truncate",
  },
]

export default function CondicionMaterialPage() {
  const { condiciones, isLoading, mutate } = useCondicionesMaterial()
  const { createCondicion, isLoading: isCreating } = useCreateCondicionMaterial()
  const { updateCondicion, isLoading: isUpdating } = useUpdateCondicionMaterial()
  const { deleteCondicion, isLoading: isDeleting } = useDeleteCondicionMaterial()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CondicionMaterial | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = condiciones.filter(
    (c) =>
      c.condicion.toLowerCase().includes(search.toLowerCase()) ||
      (c.descripcion ?? "").toLowerCase().includes(search.toLowerCase()),
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

  function openEdit(c: CondicionMaterial) {
    setIsViewing(false)
    setEditing(c)
    setForm({ condicion: c.condicion, descripcion: c.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  function openView(c: CondicionMaterial) {
    setIsViewing(true)
    setEditing(c)
    setForm({ condicion: c.condicion, descripcion: c.descripcion ?? "" })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, { condicion: [required("la condición")] })) return
    try {
      const payload = {
        condicion: form.condicion.trim(),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateCondicion({ id: editing.id, ...payload })
        toast.success("Condición actualizada")
      } else {
        await createCondicion(payload)
        toast.success("Condición creada")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar la condición")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteCondicion(id as number)
      await mutate()
      toast.success("Condición desactivada")
    } catch {
      toast.error("Error al eliminar la condición")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Condiciones de Material</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las condiciones posibles que puede tener un material al ingresar al sistema.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por condición o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} condición{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nueva condición
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando condiciones..."
        emptyText="No hay condiciones registradas."
        emptySearchText="No se encontraron condiciones con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver condición de material" : editing ? "Editar condición" : "Nueva condición de material"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.condicion}".`
            : "Completá los datos de la nueva condición."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear condición"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Condición</label>
          <Input
            value={form.condicion}
            onChange={(e) => set("condicion", e.target.value)}
            placeholder="Ej: Funcional, Reparable, Obsoleto..."
            maxLength={100}
            className={cn(errors.condicion && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.condicion}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Breve descripción de la condición"
            maxLength={255}
          />
        </div>
      </FormModal>
    </div>
  )
}
