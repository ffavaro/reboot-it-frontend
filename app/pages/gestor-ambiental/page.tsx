"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { FieldError } from "@/components/ui/field"
import {
  useGestoresAmbientales,
  useCreateGestorAmbiental,
  useUpdateGestorAmbiental,
  useDeleteGestorAmbiental,
} from "@/hooks/use-gestor-ambiental"
import { useFormErrors } from "@/hooks/use-form-errors"
import { required, cuitFormat, maxLength as maxLengthValidator } from "@/lib/form-validators"
import { enforceMaxLength, DEFAULT_TEXT_MAX } from "@/lib/utils/text-limit"
import type { GestorAmbiental } from "@/lib/type/gestor-ambiental"
import type { TableColumn } from "@/components/ui/data-table"
import Title from "@/components/ui/title"
import { Label } from "@/components/ui/label"

const EMPTY_FORM = { razonSocial: "", cuit: "", habilitacion: "", contacto: "" }

const COLUMNS: TableColumn<GestorAmbiental>[] = [
  {
    key: "razonSocial",
    header: "Razón social",
    cell: (g) => <span className="font-medium">{g.razonSocial}</span>,
  },
  {
    key: "cuit",
    header: "CUIT",
    cell: (g) => (
      <span className="font-mono text-muted-foreground">
        {g.cuit ?? <span className="italic"></span>}
      </span>
    ),
  },
  {
    key: "habilitacion",
    header: "Habilitación",
    cell: (g) =>
      g.habilitacion ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {g.habilitacion}
        </span>
      ) : (
        <span className="text-muted-foreground italic"></span>
      ),
  },
  {
    key: "contacto",
    header: "Contacto",
    cell: (g) => (
      <span className="text-muted-foreground">
        {g.contacto ?? <span className="italic"></span>}
      </span>
    ),
  },
]

export default function GestorAmbientalPage() {
  const { gestores, isLoading, mutate } = useGestoresAmbientales()
  const { createGestor, isLoading: isCreating } = useCreateGestorAmbiental()
  const { updateGestor, isLoading: isUpdating } = useUpdateGestorAmbiental()
  const { deleteGestor, isLoading: isDeleting } = useDeleteGestorAmbiental()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GestorAmbiental | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = gestores.filter(
    (g) =>
      g.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      (g.cuit ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.habilitacion ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.contacto ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  const set = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    clearError(field)
  }

  const openCreate = () => {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    reset()
    setModalOpen(true)
  }

  const openEdit = (g: GestorAmbiental) => {
    setIsViewing(false)
    setEditing(g)
    setForm({
      razonSocial: g.razonSocial,
      cuit: g.cuit ?? "",
      habilitacion: g.habilitacion ?? "",
      contacto: g.contacto ?? "",
    })
    reset()
    setModalOpen(true)
  }

  const openView = (g: GestorAmbiental) => {
    setIsViewing(true)
    setEditing(g)
    setForm({
      razonSocial: g.razonSocial,
      cuit: g.cuit ?? "",
      habilitacion: g.habilitacion ?? "",
      contacto: g.contacto ?? "",
    })
    reset()
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!validate(form, {
      razonSocial: [required("la razón social"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      cuit: [cuitFormat()],
      habilitacion: [required("el N° de habilitación"), maxLengthValidator(DEFAULT_TEXT_MAX)],
      contacto: [maxLengthValidator(DEFAULT_TEXT_MAX)],
    })) return
    try {
      const payload = {
        razonSocial: form.razonSocial.trim(),
        cuit: form.cuit.trim() || undefined,
        habilitacion: form.habilitacion.trim(),
        contacto: form.contacto.trim() || undefined,
      }
      if (editing) {
        await updateGestor({ id: editing.id, ...payload })
        toast.success("Gestor ambiental actualizado")
      } else {
        await createGestor(payload)
        toast.success("Gestor ambiental creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el gestor ambiental")
    }
  }

  const handleDelete = async (id: number | string) => {
    try {
      await deleteGestor(id as number)
      await mutate()
      toast.success("Gestor ambiental desactivado")
    } catch {
      toast.error("Error al eliminar el gestor ambiental")
    }
  }

  const canSave = !!form.razonSocial.trim() && !!form.habilitacion.trim()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
      titlePage="Gestores Ambientales"
      description="Administrá las empresas habilitadas para la disposición final de materiales."
      search={search}
      setSearch={setSearch}
      filtered={filtered}
      openCreate={openCreate}
      ></Title>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando gestores ambientales..."
        emptyText="No hay gestores ambientales registrados."
        emptySearchText="No se encontraron gestores con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver gestor ambiental" : editing ? "Editar gestor ambiental" : "Nuevo gestor ambiental"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.razonSocial}".`
            : "Completá los datos del nuevo gestor ambiental."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear gestor"}
      >
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Razón social *</Label>
          <Input
            value={form.razonSocial}
            onChange={(e) => set("razonSocial", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La razón social"))}
            placeholder="Ej: Reciclados S.A."
            className={cn(errors.razonSocial && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.razonSocial}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            CUIT <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            value={form.cuit}
            onChange={(e) => set("cuit", e.target.value.replace(/[^0-9-]/g, ""))}
            placeholder="30-12345678-9"
            maxLength={13}
            className={cn(errors.cuit && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.cuit}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">N° de habilitación *</Label>
          <Input
            value={form.habilitacion}
            onChange={(e) => set("habilitacion", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "La habilitación"))}
            placeholder="Ej: HAB-2024-001"
          />
          <FieldError>{errors.habilitacion}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Contacto <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            value={form.contacto}
            onChange={(e) => set("contacto", enforceMaxLength(e.target.value, DEFAULT_TEXT_MAX, "El contacto"))}
            placeholder="Ej: info@reciclados.com / +54 11 1234-5678"
          />
          <FieldError>{errors.contacto}</FieldError>
        </div>
      </FormModal>
    </div>
  )
}
