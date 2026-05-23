"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useRacks, useCreateRack, useUpdateRack, useDeleteRack } from "@/hooks/use-rack"
import type { Rack } from "@/lib/type/rack"

const EMPTY_FORM = { codigo: "", ubicacion: "" }

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
        {r.ubicacion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function RackPage() {
  const { racks, isLoading, mutate } = useRacks()
  const { createRack, isLoading: isCreating } = useCreateRack()
  const { updateRack, isLoading: isUpdating } = useUpdateRack()
  const { deleteRack, isLoading: isDeleting } = useDeleteRack()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rack | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = racks.filter((r: Rack) => {
    const q = search.toLowerCase()
    return (
      r.codigo.toLowerCase().includes(q) ||
      (r.ubicacion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(r: Rack) {
    setEditing(r)
    setForm({ codigo: r.codigo, ubicacion: r.ubicacion ?? "" })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.codigo.trim()) {
      toast.error("El código es obligatorio")
      return
    }
    try {
      const payload = {
        codigo: form.codigo.trim(),
        ubicacion: form.ubicacion.trim() || undefined,
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Racks</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los racks de almacenamiento físico del depósito.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por código o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} rack{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo rack
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando racks..."
        emptyText="No hay racks registrados."
        emptySearchText="No se encontraron racks con ese criterio."
        search={search}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Editar rack" : "Nuevo rack"}
        description={
          editing
            ? `Modificá los datos del rack "${editing.codigo}".`
            : "Completá los datos del nuevo rack."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear rack"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Código</label>
          <Input
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
            placeholder="Ej: RACK-A1, R-001..."
            maxLength={50}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Ubicación <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            value={form.ubicacion}
            onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))}
            placeholder="Ej: Depósito A, Sector 2, Pasillo 3..."
            maxLength={150}
          />
        </div>
      </FormModal>
    </div>
  )
}
