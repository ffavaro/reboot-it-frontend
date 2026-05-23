"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  usePallets,
  useCreatePallet,
  useUpdatePallet,
  useDeletePallet,
} from "@/hooks/use-pallet"
import { useRacks } from "@/hooks/use-rack"
import { useLotes } from "@/hooks/use-lote"
import type { Pallet } from "@/lib/type/pallet"
import type { Rack } from "@/lib/type/rack"
import type { Lote } from "@/lib/type/lote"

const EMPTY_FORM = { rackId: "", loteId: "", codigo: "", peso_kg: "" }

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
  const { lotes } = useLotes()
  const { createPallet, isLoading: isCreating } = useCreatePallet()
  const { updatePallet, isLoading: isUpdating } = useUpdatePallet()
  const { deletePallet, isLoading: isDeleting } = useDeletePallet()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pallet | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

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
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(p: Pallet) {
    setEditing(p)
    setForm({
      rackId: String(p.rackId),
      loteId: p.loteId ? String(p.loteId) : "",
      codigo: p.codigo ?? "",
      peso_kg: p.peso_kg !== null && p.peso_kg !== undefined ? String(p.peso_kg) : "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.rackId) {
      toast.error("El rack es obligatorio")
      return
    }
    try {
      const payload = {
        rackId: Number(form.rackId),
        loteId: form.loteId ? Number(form.loteId) : undefined,
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pallets</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los pallets almacenados en racks.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por código, rack o lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} pallet{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo pallet
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
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar pallet" : "Nuevo pallet"}
        description={editing ? "Modificá los datos del pallet." : "Registrá un nuevo pallet en un rack."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear pallet"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Rack</label>
          <select
            value={form.rackId}
            onChange={(e) => setForm((f) => ({ ...f, rackId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar rack...</option>
            {racks.map((r: Rack) => (
              <option key={r.id} value={r.id}>
                {r.codigo}{r.ubicacion ? ` — ${r.ubicacion}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Lote <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            value={form.loteId}
            onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sin lote asignado</option>
            {lotes.map((l: Lote) => (
              <option key={l.id} value={l.id}>
                Lote #{l.id}{l.pesoBrutoKg ? ` — ${l.pesoBrutoKg} kg` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Código <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="Ej: PLT-001"
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="Ej: 50.00"
            value={form.peso_kg}
            onChange={(e) => setForm((f) => ({ ...f, peso_kg: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}
