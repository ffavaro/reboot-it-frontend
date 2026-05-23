"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useLotes,
  useCreateLote,
  useUpdateLote,
  useDeleteLote,
} from "@/hooks/use-lote"
import type { Lote } from "@/lib/type/lote"

const EMPTY_FORM = { donacionId: "", pesoBrutoKg: "", observaciones: "" }

const columns: TableColumn<Lote>[] = [
  {
    key: "id",
    header: "ID",
    cell: (l) => <span className="font-mono text-xs">#{l.id}</span>,
  },
  {
    key: "donacionId",
    header: "Donación",
    cell: (l) => <span className="font-mono text-xs">#{l.donacionId}</span>,
  },
  {
    key: "pesoBrutoKg",
    header: "Peso bruto (kg)",
    cell: (l) => (
      <span className="text-muted-foreground">
        {l.pesoBrutoKg !== null && l.pesoBrutoKg !== undefined
          ? `${l.pesoBrutoKg} kg`
          : <span className="italic">—</span>}
      </span>
    ),
  },
  {
    key: "observaciones",
    header: "Observaciones",
    className: "max-w-[300px] truncate",
    cell: (l) => (
      <span className="text-muted-foreground">
        {l.observaciones ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function LotePage() {
  const { lotes, isLoading, mutate } = useLotes()
  const { createLote, isLoading: isCreating } = useCreateLote()
  const { updateLote, isLoading: isUpdating } = useUpdateLote()
  const { deleteLote, isLoading: isDeleting } = useDeleteLote()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lote | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = lotes.filter((l: Lote) => {
    const q = search.toLowerCase()
    return (
      String(l.donacionId).includes(q) ||
      String(l.id).includes(q) ||
      (l.observaciones ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(l: Lote) {
    setEditing(l)
    setForm({
      donacionId: String(l.donacionId),
      pesoBrutoKg: l.pesoBrutoKg !== null && l.pesoBrutoKg !== undefined ? String(l.pesoBrutoKg) : "",
      observaciones: l.observaciones ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.donacionId) {
      toast.error("La donación es obligatoria")
      return
    }
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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Lotes</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los lotes de materiales asociados a donaciones.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por ID, donación u observaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} lote{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo lote
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando lotes..."
        emptyText="No hay lotes registrados."
        emptySearchText="No se encontraron lotes con ese criterio."
        search={search}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar lote" : "Nuevo lote"}
        description={editing ? "Modificá los datos del lote." : "Registrá un nuevo lote de materiales."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear lote"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">ID de Donación</label>
          <Input
            type="number"
            placeholder="Ej: 1"
            value={form.donacionId}
            onChange={(e) => setForm((f) => ({ ...f, donacionId: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Peso bruto (kg) <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="Ej: 120.50"
            value={form.pesoBrutoKg}
            onChange={(e) => setForm((f) => ({ ...f, pesoBrutoKg: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Observaciones <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Observaciones sobre el lote..."
            value={form.observaciones}
            onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      </FormModal>
    </div>
  )
}
