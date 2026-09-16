"use client"
import { Plus } from "lucide-react"

import { useState } from "react"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
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
  usePallets,
  useCreatePallet,
  useUpdatePallet,
  useDeletePallet,
} from "@/hooks/use-pallet"
import { useRacks } from "@/hooks/use-rack"
import { useLotes, useCreateLote } from "@/hooks/use-lote"
import { useDonaciones } from "@/hooks/use-donacion"
import { useFormErrors } from "@/hooks/use-form-errors"
import { requiredSelect, positiveNumber, maxDigits } from "@/lib/form-validators"
import { enforceDecimalInput, DEFAULT_WEIGHT_MAX_DIGITS } from "@/lib/utils/number-limit"
import type { Pallet } from "@/lib/type/pallet"
import type { Rack } from "@/lib/type/rack"
import type { Lote } from "@/lib/type/lote"

const EMPTY_FORM = { rackId: "", loteId: "", codigo: "", peso_kg: "" }
const EMPTY_QUICK_LOTE = { donacionId: "", pesoBrutoKg: "", observaciones: "" }

function generatePalletCodigo(pallets: Pallet[]): string {
  const maxNumero = pallets.reduce((max, p) => {
    const match = (p.codigo ?? "").match(/(\d+)$/)
    const numero = match ? parseInt(match[1], 10) : 0
    return Math.max(max, numero)
  }, 0)
  return `PLT-${String(maxNumero + 1).padStart(4, "0")}`
}

const COLUMNS: TableColumn<Pallet>[] = [
  {
    key: "codigo",
    header: "Código",
    cell: (p) =>
      p.codigo
        ? <span className="font-mono text-xs">{p.codigo}</span>
        : <span className="italic text-muted-foreground">—</span>,
  },
  {
    key: "rack",
    header: "Rack",
    cell: (p) =>
      p.rack ? (
        <div className="flex flex-col">
          <span className="font-mono text-xs">{p.rack.codigo}</span>
          {p.rack.ubicacion && (
            <span className="text-xs text-muted-foreground">{p.rack.ubicacion}</span>
          )}
        </div>
      ) : (
        <span className="font-mono text-xs text-muted-foreground">#{p.rackId}</span>
      ),
  },
  {
    key: "lote",
    header: "Lote",
    cell: (p) =>
      p.lote ? (
        <span className="font-mono text-xs">
          #{p.lote.id}
          {p.lote.donacionId && (
            <span className="ml-1 font-sans text-muted-foreground not-italic">
              Donación #{p.lote.donacionId}
            </span>
          )}
        </span>
      ) : p.loteId ? (
        <span className="font-mono text-xs text-muted-foreground">#{p.loteId}</span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "peso_kg",
    header: "Peso (kg)",
    cell: (p) =>
      p.peso_kg !== null && p.peso_kg !== undefined
        ? `${p.peso_kg} kg`
        : <span className="italic text-muted-foreground">—</span>,
  },
]

export default function PalletPage() {
  const { pallets, isLoading, mutate } = usePallets()
  const { racks } = useRacks()
  const { lotes, mutate: mutateLotes } = useLotes()
  const { donaciones } = useDonaciones()
  const { createPallet, isLoading: isCreating } = useCreatePallet()
  const { updatePallet, isLoading: isUpdating } = useUpdatePallet()
  const { deletePallet, isLoading: isDeleting } = useDeletePallet()
  const { createLote, isLoading: isCreatingLote } = useCreateLote()
  const { errors, validate, clearError, reset } = useFormErrors<typeof EMPTY_FORM>()
  const {
    errors: loteErrors,
    validate: validateLote,
    clearError: clearLoteError,
    reset: resetLoteErrors,
  } = useFormErrors<typeof EMPTY_QUICK_LOTE>()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pallet | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [quickLoteOpen, setQuickLoteOpen] = useState(false)
  const [quickLoteForm, setQuickLoteForm] = useState(EMPTY_QUICK_LOTE)

  const filtered = pallets.filter((p: Pallet) => {
    const q = search.toLowerCase()
    const rack = p.rack ? `${p.rack.codigo} ${p.rack.ubicacion ?? ""}`.toLowerCase() : ""
    return (
      (p.codigo ?? "").toLowerCase().includes(q) ||
      rack.includes(q) ||
      String(p.rackId).includes(q) ||
      (p.loteId ? String(p.loteId).includes(q) : false)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm({ ...EMPTY_FORM, codigo: generatePalletCodigo(pallets) })
    reset()
    setModalOpen(true)
  }

  function openEdit(p: Pallet) {
    setIsViewing(false)
    setEditing(p)
    setForm({
      rackId: String(p.rackId),
      loteId: p.loteId ? String(p.loteId) : "",
      codigo: p.codigo ?? "",
      peso_kg: p.peso_kg !== null && p.peso_kg !== undefined ? String(p.peso_kg) : "",
    })
    reset()
    setModalOpen(true)
  }

  function openView(p: Pallet) {
    setIsViewing(true)
    setEditing(p)
    setForm({
      rackId: String(p.rackId),
      loteId: p.loteId ? String(p.loteId) : "",
      codigo: p.codigo ?? "",
      peso_kg: p.peso_kg !== null && p.peso_kg !== undefined ? String(p.peso_kg) : "",
    })
    reset()
    setModalOpen(true)
  }

  async function handleSave() {
    if (!validate(form, {
      rackId: [requiredSelect("un rack")],
      loteId: [requiredSelect("un lote")],
      peso_kg: [positiveNumber(), maxDigits(DEFAULT_WEIGHT_MAX_DIGITS)],
    })) return
    try {
      const payload = {
        rackId: Number(form.rackId),
        loteId: Number(form.loteId),
        codigo: form.codigo.trim() || undefined,
        peso_kg: form.peso_kg !== "" ? Number(form.peso_kg) : undefined,
      }
      if (editing) {
        await updatePallet({ id: editing.id, ...payload })
        toast.success("Pallet actualizado")
      } else {
        await createPallet(payload)
        toast.success("Pallet creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el pallet")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deletePallet(Number(id))
      await mutate()
      toast.success("Pallet desactivado")
    } catch {
      toast.error("Error al eliminar el pallet")
    }
  }

  function openQuickLote() {
    setQuickLoteForm(EMPTY_QUICK_LOTE)
    resetLoteErrors()
    setQuickLoteOpen(true)
  }

  async function handleSaveQuickLote() {
    if (!validateLote(quickLoteForm, {
      donacionId: [requiredSelect("una donación")],
      pesoBrutoKg: [positiveNumber(), maxDigits(DEFAULT_WEIGHT_MAX_DIGITS)],
    })) return
    try {
      const nuevo = await createLote({
        donacionId: Number(quickLoteForm.donacionId),
        pesoBrutoKg: quickLoteForm.pesoBrutoKg !== "" ? Number(quickLoteForm.pesoBrutoKg) : undefined,
        observaciones: quickLoteForm.observaciones.trim() || undefined,
      })
      await mutateLotes()
      if (nuevo) {
        setForm((f) => ({
          ...f,
          loteId: String(nuevo.id),
          peso_kg: nuevo.pesoBrutoKg != null ? String(nuevo.pesoBrutoKg) : f.peso_kg,
        }))
        clearError("loteId")
      }
      toast.success("Lote creado")
      setQuickLoteOpen(false)
    } catch {
      toast.error("Error al crear el lote")
    }
  }

  const canSave = !!form.rackId && !!form.loteId
  const canSaveQuickLote = !!quickLoteForm.donacionId

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pallets</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los pallets almacenados en racks.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por código, rack o lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} pallet{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo pallet
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando pallets..."
        emptyText="No hay pallets registrados."
        emptySearchText="No se encontraron pallets con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver pallet" : editing ? "Editar pallet" : "Nuevo pallet"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del pallet." : "Registrá un nuevo pallet en un rack."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveDisabled={!canSave}
        saveLabel={editing ? "Guardar cambios" : "Crear pallet"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Rack *</label>
          <select
            value={form.rackId}
            onChange={(e) => { setForm((f) => ({ ...f, rackId: e.target.value })); clearError("rackId") }}
            className={cn(
              "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              errors.rackId ? "border-destructive" : "border-input",
            )}
          >
            <option value="">Seleccionar rack...</option>
            {racks.map((r: Rack) => (
              <option key={r.id} value={r.id}>
                {r.codigo}{r.ubicacion ? ` — ${r.ubicacion}` : ""}
              </option>
            ))}
          </select>
          <FieldError>{errors.rackId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote *</label>
          <div className="flex gap-2">
            <select
              value={form.loteId}
              onChange={(e) => {
                const loteId = e.target.value
                const lote = lotes.find((l: Lote) => String(l.id) === loteId)
                setForm((f) => ({
                  ...f,
                  loteId,
                  peso_kg: lote?.pesoBrutoKg != null ? String(lote.pesoBrutoKg) : f.peso_kg,
                }))
                clearError("loteId")
              }}
              className={cn(
                "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                errors.loteId ? "border-destructive" : "border-input",
              )}
            >
              <option value="">Seleccionar lote...</option>
              {lotes.map((l: Lote) => (
                <option key={l.id} value={l.id}>
                  Lote #{l.id}{l.pesoBrutoKg ? ` — ${l.pesoBrutoKg} kg` : ""}
                </option>
              ))}
            </select>
            {!isViewing && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="No está en la lista: crear nuevo lote"
                onClick={openQuickLote}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <FieldError>{errors.loteId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Código <span className="text-muted-foreground font-normal">(autogenerado)</span>
          </label>
          <Input value={form.codigo} disabled />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 50.00"
            value={form.peso_kg}
            readOnly={!!form.loteId}
            onChange={(e) => {
              setForm((f) => ({ ...f, peso_kg: enforceDecimalInput(e.target.value, DEFAULT_WEIGHT_MAX_DIGITS, "El peso") }))
              clearError("peso_kg")
            }}
            className={cn(
              form.loteId ? "bg-muted cursor-not-allowed" : "",
              errors.peso_kg && "border-destructive focus-visible:ring-destructive",
            )}
          />
          <FieldError>{errors.peso_kg}</FieldError>
        </div>
      </FormModal>

      {/* Alta rápida de lote */}
      <FormModal
        open={quickLoteOpen}
        onOpenChange={setQuickLoteOpen}
        title="Nuevo lote"
        description="Cargá los datos del lote para asociarlo al pallet."
        onSave={handleSaveQuickLote}
        isLoading={isCreatingLote}
        saveDisabled={!canSaveQuickLote}
        saveLabel="Crear lote"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Donación *</label>
          <Select
            value={quickLoteForm.donacionId}
            onValueChange={(v) => {
              setQuickLoteForm((f) => ({ ...f, donacionId: v ?? "" }))
              clearLoteError("donacionId")
            }}
          >
            <SelectTrigger className={cn("w-full", loteErrors.donacionId && "border-destructive ring-1 ring-destructive")}>
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
          <FieldError>{loteErrors.donacionId}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso bruto (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            inputMode="decimal"
            placeholder="Ej: 120.50"
            value={quickLoteForm.pesoBrutoKg}
            onChange={(e) => {
              setQuickLoteForm((f) => ({
                ...f,
                pesoBrutoKg: enforceDecimalInput(e.target.value, DEFAULT_WEIGHT_MAX_DIGITS, "El peso bruto"),
              }))
              clearLoteError("pesoBrutoKg")
            }}
            className={cn(loteErrors.pesoBrutoKg && "border-destructive focus-visible:ring-destructive")}
          />
          <FieldError>{loteErrors.pesoBrutoKg}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Observaciones <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Observaciones sobre el lote..."
            value={quickLoteForm.observaciones}
            onChange={(e) => setQuickLoteForm((f) => ({ ...f, observaciones: e.target.value }))}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      </FormModal>
    </div>
  )
}
