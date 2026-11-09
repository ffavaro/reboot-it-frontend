"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
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
import { required, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import Title from "@/components/ui/title"
import { Label } from "@/components/ui/label"
import { filterBySearch, set, openCreate, openEdit, openView } from "@/lib/utils/utils-modal"

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
        : <span className="italic text-muted-foreground"></span>,
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

  const filtered = filterBySearch(metodos, search, ["nombre", "descripcion"])

  const handleSave = async () => {
    if (!validate(form, {
      nombre: [required("el nombre"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      descripcion: [maxLengthValidator(DEFAULT_TEXT_MAX)],
    })) return
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

  const handleDelete =  async (id: number | string) => {
    try {
      await deleteMetodo(id as number)
      await mutate()
      toast.success("Método desactivado")
    } catch {
      toast.error("Error al eliminar el método")
    }
  }

  const canSave = !!form.nombre.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Métodos de Destrucción"
        description="Administrá los métodos de destrucción segura disponibles (Trituración, Desmagnetización, etc.)."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          EMPTY_FORM,
        })}
      />

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando métodos de destrucción..."
        emptyText="No hay métodos de destrucción registrados."
        emptySearchText="No se encontraron métodos con ese criterio."
        search={search}
        onView={(t) => openView({
          t: t,
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          jsonEntidad: { nombre: t.nombre, descripcion: t.descripcion },
        })}
        onEdit={(t) => openEdit({
          t: t,
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          jsonEntidad: { nombre: t.nombre, descripcion: t.descripcion },
        })}
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
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear método"}
      >
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.nombre}
            onChange={(e) => set({
              setFrom: setForm,
              fileds: "nombre",
              value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"),
              clearError,
            })}
            placeholder="Ej: Trituración física, Desmagnetización..."
            className={cn(errors.nombre && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.nombre}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            value={form.descripcion}
            onChange={(e) => set({
              setFrom: setForm,
              fileds: "descripcion",
              value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción"),
              clearError,
            })}
            placeholder="Descripción del método de destrucción..."
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}
