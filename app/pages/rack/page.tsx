"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import { useRacks, useCreateRack, useUpdateRack, useDeleteRack } from "@/hooks/use-rack"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { Rack } from "@/lib/type/rack"
import { filterBySearch, openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import Title from "@/components/ui/title"

const EMPTY_FORM = { codigo: "", ubicacion: "" }

function generateRackCodigo(racks: Rack[]): string {
  const maxNumero = racks.reduce((max, r) => {
    const match = r.codigo.match(/(\d+)$/)
    const numero = match ? parseInt(match[1], 10) : 0
    return Math.max(max, numero)
  }, 0)
  return `RACK-${String(maxNumero + 1).padStart(3, "0")}`
}

const columns: TableColumn<Rack>[] = [
  {
    key: "codigo",
    header: "Código",
    cell: (r) => <span className="font-mono text-xs font-medium">{r.codigo}</span>,
  },
  {
    key: "ubicacion",
    header: "Ubicación",
    cell: (r) => (
      <span className="text-muted-foreground">
        {r.ubicacion ?? <span className="italic"></span>}
      </span>
    ),
  },
]

export default function RackPage() {
  const { racks, isLoading, mutate } = useRacks()
  const { createRack, isLoading: isCreating } = useCreateRack()
  const { updateRack, isLoading: isUpdating } = useUpdateRack()
  const { deleteRack, isLoading: isDeleting } = useDeleteRack()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rack | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = filterBySearch(racks, search, ["codigo", "ubicacion"]) as Rack[]

  async function handleSave() {
    if (!validate(form, {
      codigo: [required("el código")],
      ubicacion: [required("la ubicación"), maxLengthValidator(DEFAULT_TEXT_MAX)],
    })) return
    try {
      const payload = {
        codigo: form.codigo.trim(),
        ubicacion: form.ubicacion.trim(),
      }
      if (editing) {
        await updateRack({ id: editing.id, ...payload })
        toast.success("Rack actualizado")
      } else {
        await createRack(payload)
        toast.success("Rack creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el rack")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteRack(Number(id))
      await mutate()
      toast.success("Rack desactivado")
    } catch {
      toast.error("Error al eliminar el rack")
    }
  }

  const canSave = !!form.ubicacion.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Racks"
        description="Administrá los racks de almacenamiento físico del depósito."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({
          setIsViewing, setEditing, setForm, reset, setModalOpen,
          EMPTY_FORM: { ...EMPTY_FORM, codigo: generateRackCodigo(racks) },
        })}
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando racks..."
        emptyText="No hay racks registrados."
        emptySearchText="No se encontraron racks con ese criterio."
        search={search}
        onView={(t) => openView({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: { codigo: t.codigo, ubicacion: t.ubicacion ?? "" },
        })}
        onEdit={(t) => openEdit({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: { codigo: t.codigo, ubicacion: t.ubicacion ?? "" },
        })}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver rack" : editing ? "Editar rack" : "Nuevo rack"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos del rack "${editing.codigo}".`
            : "Completá los datos del nuevo rack."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear rack"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Código <span className="text-muted-foreground font-normal">(autogenerado)</span>
          </label>
          <Input
            value={form.codigo}
            disabled
            maxLength={50}
            className={cn(errors.codigo && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.codigo}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ubicación *</label>
          <Input
            value={form.ubicacion}
            onChange={(e) => set({ setFrom: setForm, fileds: "ubicacion", value: enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La ubicación"), clearError })}
            placeholder="Ej: Depósito A, Sector 2, Pasillo 3..."
            className={cn(errors.ubicacion && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.ubicacion}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}
