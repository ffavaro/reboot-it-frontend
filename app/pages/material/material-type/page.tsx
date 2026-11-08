"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useTipoMateriales,
  useCreateTipoMaterial,
  useUpdateTipoMaterial,
  useDeleteTipoMaterial,
} from "@/hooks/use-tipo-material"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { TableColumn } from "@/components/ui/data-table"
import { filterBySearch, openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import Title from "@/components/ui/title"
import { Label } from "@/components/ui/label"

const EMPTY_FORM = { nombre: "", descripcion: "" }

const COLUMNS: TableColumn<TipoMaterial>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (t) => <span className="font-medium">{t.nombre}</span>,
  },
  {
    key: "descripcion",
    header: "Descripción",
    cell: (t) => (
      <span className="text-muted-foreground">
        {t.descripcion ?? <span className="italic"></span>}
      </span>
    ),
    className: "max-w-md truncate",
  },
]

export default function TipoMaterialPage() {
  const { tipoMateriales, isLoading, mutate } = useTipoMateriales()
  const { createTipoMaterial, isLoading: isCreating } = useCreateTipoMaterial()
  const { updateTipoMaterial, isLoading: isUpdating } = useUpdateTipoMaterial()
  const { deleteTipoMaterial, isLoading: isDeleting } = useDeleteTipoMaterial()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoMaterial | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = filterBySearch(tipoMateriales, search, ["nombre", "descripcion"])

  const handleSave = async () => {
    if (!validate(form, {
      nombre: [required("el nombre"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      descripcion: [maxLengthValidator(DEFAULT_TEXT_MAX)],
    })) return
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || "",
      }
      if (editing) {
        await updateTipoMaterial({ id: editing.id, ...payload })
        toast.success("Tipo de material actualizado")
      } else {
        await createTipoMaterial(payload)
        toast.success("Tipo de material creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el tipo de material")
    }
  }

  const handleDelete =  async (id: number | string) => {
    try {
      await deleteTipoMaterial(id as number)
      await mutate()
      toast.success("Tipo de material desactivado")
    } catch {
      toast.error("Error al eliminar el tipo de material")
    }
  }

  const canSave = !!form.nombre.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Tipos de Material"
        description="Administrá las categorías de materiales que ingresan al sistema."
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
        loadingText="Cargando tipos de material..."
        emptyText="No hay tipos de material registrados."
        emptySearchText="No se encontraron tipos con ese criterio."
        search={search}
        onView={(t) => openView({
          t,
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          jsonEntidad: { nombre: t.nombre, descripcion: t.descripcion ?? "" },
        })}
        onEdit={(t) => openEdit({
          t,
          setIsViewing,
          setEditing,
          setForm,
          reset,
          setModalOpen,
          jsonEntidad: { nombre: t.nombre, descripcion: t.descripcion ?? "" },
        })}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver tipo de material" : editing ? "Editar tipo de material" : "Nuevo tipo de material"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo tipo de material."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear tipo"}
      >
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Nombre *</Label>
          <Input
            value={form.nombre}
            onChange={(e) =>
              set({
                setFrom: setForm,
                fileds: "nombre",
                value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El nombre"),
                clearError,
              })
            }
            placeholder="Ej: Electrónico, Eléctrico, Batería..."
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
            onChange={(e) =>
              set({
                setFrom: setForm,
                fileds: "descripcion",
                value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La descripción"),
                clearError,
              })
            }
            placeholder="Breve descripción del tipo de material"
          />
          <FieldError>{errors.descripcion}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}
