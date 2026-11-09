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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useLotes,
  useCreateLote,
  useUpdateLote,
  useDeleteLote,
} from "@/hooks/use-lote"
import { useDonaciones } from "@/hooks/use-donacion"
import { useFormErrors } from "@/hooks/use-form-errors"
import { requiredSelect, positiveNumber, maxDigits } from "@/lib/form-validators"
import { enforceDecimalInput, DEFAULT_WEIGHT_MAX_DIGITS } from "@/lib/utils/number-limit"
import type { Lote } from "@/lib/type/lote"
import { openCreate, openEdit, openView, set } from "@/lib/utils/utils-modal"
import Title from "@/components/ui/title"

const EMPTY_FORM = { donacionId: "", pesoBrutoKg: "", observaciones: "" }

const columns: TableColumn<Lote>[] = [
  {
    key: "id",
    header: "N° Lote",
    cell: (l) => <span className="font-mono text-xs">#{l.id}</span>,
  },
  {
    key: "donacionId",
    header: "Donación",
    cell: (l) => <span className="font-mono text-xs">#{l.donacionId} - {l.donacion?.donante?.nombre}</span>,
  },
  {
    key: "pesoBrutoKg",
    header: "Peso bruto (kg)",
    cell: (l) => (
      <span className="text-muted-foreground">
        {l.pesoBrutoKg !== null && l.pesoBrutoKg !== undefined
          ? `${l.pesoBrutoKg} kg`
          : <span className="italic"></span>}
      </span>
    ),
  },
  {
    key: "observaciones",
    header: "Observaciones",
    className: "max-w-[300px] truncate",
    cell: (l) => (
      <span className="text-muted-foreground">
        {l.observaciones ?? <span className="italic"></span>}
      </span>
    ),
  },
]

export default function LotePage() {
  const { donaciones } = useDonaciones()
  const { lotes, isLoading, mutate } = useLotes()
  const { createLote, isLoading: isCreating } = useCreateLote()
  const { updateLote, isLoading: isUpdating } = useUpdateLote()
  const { deleteLote, isLoading: isDeleting } = useDeleteLote()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lote | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = lotes.filter((l: Lote) => {
    const q = search.toLowerCase()
    return (
      String(l.donacionId).includes(q) ||
      String(l.id).includes(q) ||
      (l.observaciones ?? "").toLowerCase().includes(q)
    )
  })

  async function handleSave() {
    if (!validate(form, {
      donacionId: [requiredSelect("una donación")],
      pesoBrutoKg: [positiveNumber(), maxDigits(DEFAULT_WEIGHT_MAX_DIGITS)],
    })) return
    try {
      const payload = {
        donacionId: Number(form.donacionId),
        pesoBrutoKg: form.pesoBrutoKg !== "" ? Number(form.pesoBrutoKg) : undefined,
        observaciones: form.observaciones.trim() || undefined,
      }
      if (editing) {
        await updateLote({ id: editing.id, ...payload })
        toast.success("Lote actualizado")
      } else {
        await createLote(payload)
        toast.success("Lote creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el lote")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteLote(Number(id))
      await mutate()
      toast.success("Lote desactivado")
    } catch {
      toast.error("Error al eliminar el lote")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Title
        titlePage="Lotes"
        description="Administrá los lotes de materiales asociados a donaciones."
        search={search}
        setSearch={setSearch}
        filtered={filtered}
        openCreate={() => openCreate({ setIsViewing, setEditing, setForm, reset, setModalOpen, EMPTY_FORM })}
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando lotes..."
        emptyText="No hay lotes registrados."
        emptySearchText="No se encontraron lotes con ese criterio."
        search={search}
        onView={(t) => openView({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: {
            donacionId: String(t.donacionId),
            pesoBrutoKg: t.pesoBrutoKg !== null && t.pesoBrutoKg !== undefined ? String(t.pesoBrutoKg) : "",
            observaciones: t.observaciones ?? "",
          },
        })}
        onEdit={(t) => openEdit({
          t, setIsViewing, setEditing, setForm, reset, setModalOpen,
          jsonEntidad: {
            donacionId: String(t.donacionId),
            pesoBrutoKg: t.pesoBrutoKg !== null && t.pesoBrutoKg !== undefined ? String(t.pesoBrutoKg) : String(t.donacion?.pesoEstimadoKg),
            observaciones: t.observaciones ?? "",
          },
        })}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver lote" : editing ? "Editar lote" : "Nuevo lote"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del lote." : "Registrá un nuevo lote de materiales."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear lote"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Donación</label>
          <Select
            value={form.donacionId}
            onValueChange={(v) => set({ setFrom: setForm, fileds: "donacionId", value: v ?? "", clearError })}
            disabled={isViewing}
          >
            <SelectTrigger className={cn("w-full", errors.donacionId && "border-destructive ring-1 ring-destructive")}>
              <SelectValue placeholder="Seleccioná una donación" />
            </SelectTrigger>
            <SelectContent>
              {donaciones.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  <span className="font-mono text-xs text-muted-foreground w-8 shrink-0">#{d.id}</span>
                  <span className="font-medium truncate">{d.donante?.nombre ?? `Donante #${d.donanteId}`}</span>
                  {d.descripcion && (
                    <span className="text-xs text-muted-foreground truncate">· {d.descripcion}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.donacionId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso bruto (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 120.50"
            value={form.pesoBrutoKg}
            onChange={(e) => set({ setFrom: setForm, fileds: "pesoBrutoKg", value: enforceDecimalInput(e.target.value, DEFAULT_WEIGHT_MAX_DIGITS, "El peso bruto"), clearError })}
            className={cn(errors.pesoBrutoKg && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{errors.pesoBrutoKg}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Observaciones <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Observaciones sobre el lote..."
            value={form.observaciones}
            onChange={(e) => set({ setFrom: setForm, fileds: "observaciones", value: e.target.value, clearError })}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      </FormModal>
    </div>
  )
}
