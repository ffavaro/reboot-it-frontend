"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { FormModal } from "@/components/ui/form-modal"
import {
  useMateriales,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from "@/hooks/use-material"
import { useLotes } from "@/hooks/use-lote"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import type { Material } from "@/lib/type/material"
import type { Lote } from "@/lib/type/lote"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"

const EMPTY_FORM = { loteId: "", tipoMaterialId: "", condicionMaterialId: "", descripcion: "" }

const columns: TableColumn<Material>[] = [
  {
    key: "loteId",
    header: "Lote",
    cell: (m) => <span className="font-mono text-xs">#{m.loteId}</span>,
  },
  {
    key: "tipoMaterial",
    header: "Tipo de material",
    cell: (m) =>
      m.tipoMaterial?.nombre ?? (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "condicion",
    header: "Condición",
    cell: (m) =>
      m.condicionMaterial?.condicion ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {m.condicionMaterial.condicion}
        </span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "descripcion",
    header: "Descripción",
    className: "max-w-[240px] truncate",
    cell: (m) => (
      <span className="text-muted-foreground">
        {m.descripcion ?? <span className="italic">—</span>}
      </span>
    ),
  },
]

export default function MaterialPage() {
  const { materiales, isLoading, mutate } = useMateriales()
  const { lotes } = useLotes()
  const { tipoMateriales } = useTipoMateriales()
  const { condiciones } = useCondicionesMaterial()
  const { createMaterial, isLoading: isCreating } = useCreateMaterial()
  const { updateMaterial, isLoading: isUpdating } = useUpdateMaterial()
  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial()

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = materiales.filter((m: Material) => {
    const q = search.toLowerCase()
    const tipo = m.tipoMaterial?.nombre?.toLowerCase() ?? ""
    const condicion = m.condicionMaterial?.condicion?.toLowerCase() ?? ""
    return (
      String(m.loteId).includes(q) ||
      tipo.includes(q) ||
      condicion.includes(q) ||
      (m.descripcion ?? "").toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setIsViewing(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(m: Material) {
    setIsViewing(false)
    setEditing(m)
    setForm({
      loteId: String(m.loteId),
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: String(m.condicionMaterialId),
      descripcion: m.descripcion ?? "",
    })
    setModalOpen(true)
  }

  function openView(m: Material) {
    setIsViewing(true)
    setEditing(m)
    setForm({
      loteId: String(m.loteId),
      tipoMaterialId: String(m.tipoMaterialId),
      condicionMaterialId: String(m.condicionMaterialId),
      descripcion: m.descripcion ?? "",
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.loteId || !form.tipoMaterialId || !form.condicionMaterialId) {
      toast.error("Lote, tipo de material y condición son obligatorios")
      return
    }
    try {
      const payload = {
        loteId: Number(form.loteId),
        tipoMaterialId: Number(form.tipoMaterialId),
        condicionMaterialId: Number(form.condicionMaterialId),
        descripcion: form.descripcion.trim() || undefined,
      }
      if (editing) {
        await updateMaterial({ id: editing.id, ...payload })
        toast.success("Material actualizado")
      } else {
        await createMaterial(payload)
        toast.success("Material creado")
      }
      await mutate()
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el material")
    }
  }

  async function handleDelete(id: number | string) {
    try {
      await deleteMaterial(Number(id))
      await mutate()
      toast.success("Material desactivado")
    } catch {
      toast.error("Error al eliminar el material")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los materiales registrados por lote.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por lote, tipo, condición o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} material{filtered.length !== 1 ? "es" : ""}
        </span>
        <Button className="ml-auto" onClick={openCreate}>
          + Nuevo material
        </Button>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        loadingText="Cargando materiales..."
        emptyText="No hay materiales registrados."
        emptySearchText="No se encontraron materiales con ese criterio."
        search={search}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={isViewing ? "Ver material" : editing ? "Editar material" : "Nuevo material"}
        readOnly={isViewing}
        description={editing ? "Modificá los datos del material." : "Registrá un nuevo material en un lote."}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        saveLabel={editing ? "Guardar cambios" : "Crear material"}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Lote</label>
          <select
            value={form.loteId}
            onChange={(e) => setForm((f) => ({ ...f, loteId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar lote...</option>
            {lotes.map((l: Lote) => (
              <option key={l.id} value={l.id}>
                #{l.id} — Donación #{l.donacionId}
                {l.pesoBrutoKg ? ` (${l.pesoBrutoKg} kg)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo de material</label>
          <select
            value={form.tipoMaterialId}
            onChange={(e) => setForm((f) => ({ ...f, tipoMaterialId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar tipo...</option>
            {tipoMateriales.map((t: TipoMaterial) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Condición</label>
          <select
            value={form.condicionMaterialId}
            onChange={(e) => setForm((f) => ({ ...f, condicionMaterialId: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Seleccionar condición...</option>
            {condiciones.map((c: CondicionMaterial) => (
              <option key={c.id} value={c.id}>{c.condicion}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Input
            placeholder="Descripción del material..."
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  )
}
