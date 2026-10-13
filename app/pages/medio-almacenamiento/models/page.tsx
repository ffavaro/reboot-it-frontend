"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import { useModelos, useCreateModelo, useUpdateModelo, useDeleteModelo } from "@/hooks/use-modelo"
import { useTipos } from "@/hooks/use-tipo"
import { useMarcas } from "@/hooks/use-marca"
import type { Modelo } from "@/lib/type/modelo"
import type { Tipo } from "@/lib/type/tipo"
import type { Marca } from "@/lib/type/marca"
import type { TableColumn } from "@/components/ui/data-table"

const EMPTY_FORM = { nombre: "", marcaId: "", tipoId: "" }

const COLUMNS: TableColumn<Modelo>[] = [
  {
    key: "nombre",
    header: "Nombre",
    cell: (m) => <span className="font-medium">{m.nombre}</span>,
  },
  {
    key: "marca",
    header: "Marca",
    cell: (m) => <span className="text-muted-foreground">{m.marca?.nombre ?? "—"}</span>,
  },
  {
    key: "tipo",
    header: "Tipo",
    cell: (m) => <span className="text-muted-foreground">{m.tipo?.nombre ?? "—"}</span>,
  },
]

export default function ModelosPage() {
  const { modelos, isLoading, mutate } = useModelos()
  const { tipos } = useTipos()
  const { marcas } = useMarcas()
  const { createModelo, isLoading: isCreating } = useCreateModelo()
  const { updateModelo, isLoading: isUpdating } = useUpdateModelo()
  const { deleteModelo, isLoading: isDeleting } = useDeleteModelo()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Modelo | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = modelos.filter((m: Modelo) =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (m.marca?.nombre ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.tipo?.nombre ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(m: Modelo) {
    setIsViewing(false)
    setEditing(m)
    setForm({ nombre: m.nombre, marcaId: String(m.marcaId), tipoId: String(m.tipoId) })
    setModalOpen(true)
  }

  function openView(m: Modelo) {
    setIsViewing(true)
    setEditing(m)
    setForm({ nombre: m.nombre, marcaId: String(m.marcaId), tipoId: String(m.tipoId) })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim() || !form.marcaId || !form.tipoId) {
      toast.error("Nombre, marca y tipo son obligatorios")
      return
    }
    try {
      const payload = {
        nombre: form.nombre.trim(),
        marcaId: Number(form.marcaId),
        tipoId: Number(form.tipoId),
      }
      if (editing) {
        await updateModelo({ id: editing.id, ...payload })
        toast.success("Modelo actualizado")
      } else {
        await createModelo(payload)
        toast.success("Modelo creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el modelo")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteModelo(id as number)
      await mutate()
      toast.success("Modelo desactivado")
    } catch {
      toast.error("Error al eliminar el modelo")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Modelos</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los modelos de medios de almacenamiento por marca y tipo.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por nombre, marca o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} modelo{filtered.length !== 1 ? "s" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo modelo
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={COLUMNS}
        isLoading={isLoading}
        loadingText="Cargando modelos..."
        emptyText="No hay modelos registrados."
        emptySearchText="No se encontraron modelos con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(open) => !open && setModalOpen(false)}
        title={isViewing ? "Ver modelo" : editing ? "Editar modelo" : "Nuevo modelo"}
        readOnly={isViewing}
        description={
          editing
            ? `Modificá los datos de "${editing.nombre}".`
            : "Completá los datos del nuevo modelo."
        }
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear modelo"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nombre</label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Barracuda 2TB, Blue 1TB..."
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Marca</label>
          <select
            value={form.marcaId}
            onChange={(e) => setForm((f) => ({ ...f, marcaId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar marca...</option>
            {marcas.map((m: Marca) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo</label>
          <select
            value={form.tipoId}
            onChange={(e) => setForm((f) => ({ ...f, tipoId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar tipo...</option>
            {tipos.map((t: Tipo) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      </FormModal>
    </div>
  )
}
